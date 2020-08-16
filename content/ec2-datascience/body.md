---
title: Building a Data Science AMI for AWS EC2
---

[&larr; Back to main page](/)

August 15, 2020

This page outlines the current AMI I use for data science projects on AWS EC2. I
update this stack every couple of months when new versions of the base software
are released.

### What's included and why

Amazon Linux 2

: The AMI is built on [Amazon Linux 2](https://aws.amazon.com/amazon-linux-2/)
which has a good selection of packages and is optimized for EC2. It's mostly
compatible with CentOS / Redhat packages which is helpful for installing
pre-compiled software like Rstudio Server. You can also add EPEL (see [here for
instructions](https://aws.amazon.com/premiumsupport/knowledge-center/ec2-enable-epel/))
for access to a much broader range of packages.

R 3.6.3 + Tidyverse

: I use R for almost all my analysis, usually in conjunction with the
[tidyverse](https://www.tidyverse.org/). Check out [R for Data
Science](https://r4ds.had.co.nz/) for a good introduction. The latest version of
R is actually 4.0.2 but I prefer to wait for a .1 release before switching to
a major new version so for now I am using 3.6.3.

RStudio Server

: The AMI uses the open-source version of [Rstudio
Server](https://rstudio.com/products/rstudio/#rstudio-server) to provide a
browser-based graphical interface to R running on EC2. Although Rstudio Server
can support multiple users, I use it exclusively in single-user mode and don't
allow logins from the open internet; instead I just tunnel via ssh on port 8787.
See the code below for details.

![R running in the browser via Rstudio Server
(from [Wikipedia](https://en.wikipedia.org/wiki/RStudio))](Rstudio.png)

Python 3.7 + Pandas + Jupyter

: Python 3.7 is the standard Python version that comes with Amazon Linux 2. I
write quite a bit of Python code but usually for ETL jobs or shell scripts
rather than analytical tasks (I prefer R for analysis). However, I always
install Pandas and Jupyter as they are key tools for data science.

Various utilities

: These include the latest versions of [Pandoc](https://pandoc.org/) for
processing markdown and Rmarkdown, [jq](https://stedolan.github.io/jq/) for
command-line JSON parsing, and the [AWS CLI](https://aws.amazon.com/cli/) for
interacting with AWS services. The version of the AWS CLI that comes with Amazon
Linux 2 is quite old so I always install the latest version in Python virtual
environment so it can be updated more regularly.

### How it's built

The AMI is built using Packer. The
[intro documentation](https://www.packer.io/intro) for Packer is excellent
so I recommend starting there. The basic steps are:

1. Spin up a small EC2 instance (e.g. t3.nano) to run the `packer` binary.
2. Create a `packer.json` template file containing information on
   how to build the AMI (instance type, source AMI, commands to run, etc.)
3. Create an `install.sh` script that is referenced in `packer.json`. This
   install script will download and compile the necessary software.
4. Run `packer build packer.json`. This spins up a new machine, copies
   the `install.sh` script over to it, runs the script and installs all the
   software, then saves the result as an AMI and terminates the build machine.

### Code

Template file `packer.json`

```json
{
  "builders": [
    {
      "type": "amazon-ebs",
      "region": "us-west-1",
      "source_ami": "ami-04e59c05167ea7bd5",
      "instance_type": "c5.xlarge",
      "ssh_username": "ec2-user",
      "ami_name": "packer-datascience 20200613 {{timestamp}}",
      "launch_block_device_mappings": [
        {
          "device_name": "/dev/xvda",
          "volume_size": 20,
          "volume_type": "gp2",
          "delete_on_termination": true
        }
      ]
    }
  ],
  "provisioners": [
    {
      "type": "file",
      "source": "./install.sh",
      "destination": "/tmp/"
    },
    {
      "type": "shell",
      "inline": [
        "sudo bash /tmp/install.sh"
      ]
    }
  ]
}
```

Installation script `install.sh` run by packer to build the AMI.

```bash
#!/bin/bash

# Update and install packages
yum update -y
yum install -y emacs pigz python3 git ImageMagick
echo "
(setq inhibit-splash-screen t)
(setq make-backup-files nil)
(setq-default indent-tabs-mode nil)
(electric-indent-mode -1)
" >> /usr/share/emacs/site-lisp/site-start.el

# In Fedora /usr/local/bin/ isn't in the standard path. It is
# added by the login program (see man login), which doesn't run
# when calling a bash script from cron. For simplicity, add it to
# path for all users.
echo 'export PATH="/usr/local/bin/:$PATH"' >> /etc/profile.d/custom.sh
# Source the file to pick up these changes for the rest of the script
. /etc/profile.d/custom.sh

# To hold installation files
cd /tmp

# Install jq
curl -L https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64 \
    -o /usr/local/bin/jq
chmod a+rx /usr/local/bin/jq

# Install texlive
yum install -y perl-Digest-MD5
wget http://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz
tar xvf install-tl-unx.tar.gz
cd install-tl-*
# Get profile. Note that we have selected to add symlinks to /usr/local/bin
# rather than adding to the PATH variable. This is because rstudio server
# open source version does not properly inherit the PATH variable from
# custom.sh, instead it sets its own path which DOES include /usr/local/bin.
echo '
selected_scheme scheme-custom
TEXDIR /usr/local/texlive/2020
TEXMFCONFIG ~/.texlive2020/texmf-config
TEXMFHOME ~/texmf
TEXMFLOCAL /usr/local/texlive/texmf-local
TEXMFSYSCONFIG /usr/local/texlive/2020/texmf-config
TEXMFSYSVAR /usr/local/texlive/2020/texmf-var
TEXMFVAR ~/.texlive2020/texmf-var
binary_x86_64-linux 1
collection-basic 1
collection-fontsrecommended 1
collection-latex 1
collection-latexextra 1
collection-latexrecommended 1
collection-metapost 1
collection-xetex 1
instopt_adjustpath 1
instopt_adjustrepo 1
instopt_letter 1
instopt_portable 0
instopt_write18_restricted 1
tlpdbopt_autobackup 1
tlpdbopt_backupdir tlpkg/backups
tlpdbopt_create_formats 1
tlpdbopt_desktop_integration 1
tlpdbopt_file_assocs 1
tlpdbopt_generate_updmap 0
tlpdbopt_install_docfiles 0
tlpdbopt_install_srcfiles 0
tlpdbopt_post_code 1
tlpdbopt_sys_bin /usr/local/bin
tlpdbopt_sys_info /usr/local/info
tlpdbopt_sys_man /usr/local/man
tlpdbopt_w32_multi_user 1
' > texlive-install.profile
./install-tl -profile texlive-install.profile
cd /tmp
rm -rf install-tl-*

wget https://github.com/jgm/pandoc/releases/download/2.9.2.1/pandoc-2.9.2.1-linux-amd64.tar.gz
tar xvzf pandoc-2.9.2.1-linux-amd64.tar.gz --strip-components 1 -C /usr/local
rm -rf pandoc-2.9.2*

# Various development packages needed to compile R
yum install -y gcc gcc-gfortran gcc-c++
yum install -y readline-devel zlib-devel bzip2-devel xz-devel pcre-devel
yum install -y libcurl-devel libpng-devel cairo-devel pango-devel

# Install R
curl -O https://cran.r-project.org/src/base/R-3/R-3.6.3.tar.gz
tar xvf R-3.6.3.tar.gz
cd R-3.6.3
./configure --with-x=no --enable-R-shlib
# Use 4 cores to speed up build
make -j 4
make install
cd /tmp
rm -rf R-3.6.3*

# Install tidyverse
yum install -y libxml2-devel openssl-devel
echo 'options(repos = c(CRAN="https://cran.r-project.org/"))' >> /usr/local/lib64/R/etc/Rprofile.site
/usr/local/bin/R -e 'install.packages(c("tidyverse"), Ncpus = 4L)'

# Add rstudio
/usr/local/bin/R -e 'install.packages(c("caTools", "bitops", "rprojroot"))'
curl -O https://download2.rstudio.org/server/centos6/x86_64/rstudio-server-rhel-1.3.959-x86_64.rpm
yum install -y --nogpgcheck rstudio-server-rhel-1.3.959-x86_64.rpm
rm -f rstudio-server-rhel-1.3.959-x86_64.rpm
# Will serve on port 8787 by default
echo www-address=127.0.0.1 >> /etc/rstudio/rserver.conf
echo rsession-which-r=/usr/local/bin/R >> /etc/rstudio/rserver.conf
# Add password for ec2-user using passwd ec2-user then do
# rstudio-server restart

# Other useful R packages
/usr/local/bin/R -e 'install.packages(c("corrplot", "plotly", "data.table", "slider"), Ncpus = 4L)'

# Parallel (installs into /usr/local/bin)
curl pi.dk/3/ | bash
rm -rf parallel-*

# Datamash
yum install -y perl-Digest-SHA perl-Data-Dumper
wget https://ftp.gnu.org/gnu/datamash/datamash-1.7.tar.gz
tar xvf datamash-1.7.tar.gz
cd datamash-1.7
./configure
make
make install
cd /tmp
rm -rf datamash-1.7*

# xsv
wget https://github.com/BurntSushi/xsv/releases/download/0.13.0/xsv-0.13.0-x86_64-unknown-linux-musl.tar.gz
tar xvf xsv-0.13.0-x86_64-unknown-linux-musl.tar.gz
mv xsv /usr/local/bin
rm xvf xsv-0.13.0-x86_64-unknown-linux-musl.tar.gz

# https://askubuntu.com/questions/919054/how-do-i-run-a-single-command-at-startup-using-systemd
echo "[Unit]
Description=Local File Browser

[Service]
ExecStart=/bin/bash -c 'cd /home; /bin/python3 -m http.server 8001'

[Install]
WantedBy=multi-user.target" > /etc/systemd/system/filebrowser.service
chmod u+x /etc/systemd/system/filebrowser.service
systemctl enable filebrowser
```
