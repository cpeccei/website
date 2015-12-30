Title: Predicting Home Prices from Realty Descriptions
Date: 2015-12-25
Slug: homeprice

My wife and I recently bought a lovely house in Sunnyvale,
CA. The overall process went very smoothly (thanks to our realtor
[Patrick Johnson](http://www.dreamsbytheyard.com)) which gave
me some spare time to do a little data mining on the property
market in Silicon Valley. There are so many interesting
applications for analytics in the real estate domain that I will
probably write another couple of articles on the subject, but for
now I'll focus on a fun data visualization derived from
text-mining home descriptions.

I will also add that I had the pleasure of meeting some of the
team at [Trulia.com](http://www.trulia.com) earlier
this year and they are the ones to watch when it comes to
real-estate analytics. They've got great people, huge amounts of
data and a robust business model. It will be exciting to see what
they bring to market over the next year.

So, back to the data mining. If you have ever read an MLS
listing describing a house for sale you will be familiar with
language like this:

> Classic streamlined California home w/ abundant built-ins, rich hardwood
> flooring & tall picture windows to the exterior gardens. Large
> Living Room w/ built in shelving & fireplace. Updated Kitchen
> w/ granite & stainless steel. Formal Dining w/ sliding door to
> dining deck & grounds. Fresh air sunroom w/ doors to pool and
> gardens. Fourishing grounds w/ level lawns. Close to Stanford,
> dining and shopping.

That certainly sounds attractive...it almost makes me want to
pay over the asking price! In fact, that is exactly what I wanted
to explore: does the language used in the home description have any
statistical relationship with whether or not the home sells for
above or below asking price?

The graphic below lets us explore this question in detail. It
was produced by text mining the descriptions of 1300 homes that
sold in Silicon Valley in 2011 and then computing the average sale
price (as a percentage above or below the initial asking price) of
each home containing that word. So for example, homes with the
word "entertaining" in their description sold for well above their
asking price (about 2.8% on average). Words such as "stunning" (-1.2%) and
"bonus" (-1.6%) did not fare so well; you may want to underbid on houses
with those terms in their description!

You can hover over a circle with your mouse to see a pop-up with some sample
text from the MLS listings.

Sale price relative to asking

Here's how I created the visualization:

1. Download a CSV file from Redfin.com containing data on 1300
   homes that sold in Menlo Park, Palo Alto or Mountain View in 2011
   with a sale price between $600k and $2M.

2. The CSV file contains a URL for each house; the URL links to a
   web page with its MLS description along with its initial and final
   selling price. Unfortunately you can only see this page if you are
   logged in to your Redfin account. That means you can't just use
   Python's urrllib module to webscrape the MLS text; you need to use
   some cookie handling code to let Python access the Redfin
   website. The script 1_compile_data.py below shows how this
   works. I exported my cookie file for use in the Python script
   using the [Export Cookies](https://addons.mozilla.org/en-us/firefox/addon/export-cookies/)
   add-on for Firefox.

3. The output of 1_compile_data.py is a new CSV file containing
   cleaned data on each house, along with the text of its realty
   description. This is then parsed with the script
   2_create_visualization.py that uses Matplotlib to create a PNG of the
   visualization. The script also creates the HTML divs that act
   as triggers for the tooltips over each word.


And here are the two Python scripts discussed above.

### 1_compile_data.py

```python
# Import modules
# ==============

# Standard library modules (tested on Python 2.6 under Windows 7)
import csv
import cookielib
import urllib2
import re

# Beautifulsoup for webscraping (http://www.crummy.com/software/BeautifulSoup/)
import BeautifulSoup

# Define some constants
# =====================

# Inputs:
# - A CSV file downloaded from Redfin
# - Cookie file exported from Firefox allowing login to Redfin
#
# Outputs:
# - A CSV file containing coded features about a property plus the html
#   description from the Redfin page

REDFIN_CSV_FILE = '../data/redfin_data.csv'
COOKIE_FILE = '../data/cookies.txt'
OUTPUT_CSV_FILE = '../data/features.csv'

# Main script starts here
# =======================

# Set up cookies so that we can access Redfin pages through urrllib2
cj = cookielib.MozillaCookieJar()
cj.load(COOKIE_FILE)
opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj))
urllib2.install_opener(opener)

# Create input and output CSV files
input_csv = csv.reader(open(REDFIN_CSV_FILE, 'rb'))
output_csv = csv.writer(open(OUTPUT_CSV_FILE, 'wb'))
header = ['sq_ft',
          'lot_size',
          'beds',
          'baths',
          'yr_built',
          'original_listprice',
          'parking_spots',
          'url',
          'sale_price',
          'description']
output_csv.writerow(header)

# Loop over rows in input CSV (downloaded from Redfin) that contain
# data on each home.
input_csv.next()
for row in input_csv:

    # Select some potentially useful variables from the CSV
    # that we will want to include in our output file
    sq_ft = row[10]
    lot_size = row[11]
    beds = row[7]
    baths = row[8]
    yr_built = row[12]
    original_listprice = row[20]
    parking_spots = row[13]
    url = row[23]

    # The url field contains a link to the home's MLS page with
    # realtor description and sale history
    req = urllib2.Request(url)
    handle = urllib2.urlopen(req)

    # Use Beautiful soup to scrape the text of the property
    # description and also the final sale price
    html = handle.read()
    soup = BeautifulSoup.BeautifulSoup(html)
    try:
        description = soup.find('div', id='property_description').text
    except AttributeError:
        description = ''
    try:
        sale_price = soup.find('div', attrs={'class': 'price'}).text
        sale_price = re.sub('[^0-9]', '', sale_price)
    except AttributeError:
        sale_price = ''

    # Create row of final output data
    data = [sq_ft,
            lot_size,
            beds,
            baths,
            yr_built,
            original_listprice,
            parking_spots,
            url,
            sale_price,
            description]
    print url, description
    output_csv.writerow(data)
```

### 2_create_visualization.py

```python
# Import modules
# ==============

import random
import csv
import re

# Define some constants
# =====================

FEATURES_CSV_FILE = '../data/features.csv'
CONCORDANCE_WIDTH = 8
OUTPUT_HTML_FILE = '../output/visualization.html'

# Some basic stats functions
# ==========================

def mean(x):
    return sum(x) / len(x)

def stdev(x):
    m = mean(x)
    return mean([(p - m)**2 for p in x])**0.5

def sterr(x):
    return stdev(x) / len(x)**0.5

# Main script starts here
# =======================

# First step is to read in the CSV file produced by the script
# 1_compile_data.py. We will build up a dictionary called word_data
# that contains all the  information for each word needed to create
# the final visualization.
word_data = {}
input_csv = csv.reader(open(FEATURES_CSV_FILE, 'rb'))
# Skip header line
input_csv.next()
for row in input_csv:
    (sq_ft,
     lot_size,
     beds,
     baths,
     yr_built,
     original_listprice,
     parking_spots,
     url,
     sale_price,
     description) = row
    # Compute the variable 'pct', the percentage over the original list
    # price at which a house eventually sold. This will be the y-axis
    # of the final plot.
    # Sometimes the sale price or original list price will be missing
    # in the data so we use a try statement to skip over these records.
    try:
        pct = (float(sale_price) / float(original_listprice) - 1) * 100
    except ValueError:
        continue
    # A data cleaning step: if the percentage increase/decrease is very
    # large or small there is probably something strange going on. For
    # example, the home sale might not have been an "at arm's length"
    # transaction (e.g. a parent sold to their child for a big discount).
    # We'll skip these records.
    if abs(pct) > 20:
        continue
    # Use the text from the home description to create concordances
    # for each word. A concordance is a snippet of text surrrounding
    # a given word that provides the user with some context. It will
    # appear in the tooltips in the final visualization.
    #
    # Strip any HTML tags from the home description
    description = ' ' + re.sub('<.*?>', ' ', description) + ' '
    # Split the text into alternating tokens of non-word, word, non-word, etc
    tokens = re.split('([^A-Za-z]+)', description)
    # Build the concordances for each word. Note that we are going to add
    # some HTML tags to the concordances so they will display nicely
    # in the tooltips.
    words = set()
    for i in range(2, len(tokens) - 2, 2):
        word = tokens[i].lower()
        words.add(word)
        i_start = max(i - CONCORDANCE_WIDTH, 0)
        i_end = i + CONCORDANCE_WIDTH
        # We will wrap the focus word of this concordance in a highlight
        # tag so we can make it stand out in the tooltip.
        concordance = '... ' + ''.join(tokens[i_start:i] +
            ["<span class='word'>" + tokens[i] + '</span>'] +
            tokens[i + 1:i_end]) + ' ...<br />'
        if word not in word_data:
            word_data[word] = {'concordances': [], 'pct': []}
        word_data[word]['concordances'].append(concordance)
    # Now that we know all the words that appeared in this description,
    # we store the pct value in a list for each of the words. In the next
    # step we will compute the mean pct for each word.
    for word in words:
        word_data[word]['pct'].append(pct)

# Compute the mean pct increase/decrease for all homes with
# a given word in their description. Also compute number of home
# descriptions containing that word. Finally, compute the standard error
# of the mean so that we can only include words with a "reliable" estimate
# of their mean.
for word in word_data:
    pct = word_data[word]['pct']
    word_data[word]['n'] = len(pct)
    word_data[word]['mean_pct'] = mean(pct)
    word_data[word]['sterr_pct'] = sterr(pct)

# To eliminate "noise" words we will filter the list of words to only include
# those with a small standard error of the mean
for word in word_data.keys():
    if word_data[word]['sterr_pct'] > .9 or word_data[word]['n'] < 50 or \
    len(word) < 4:
        del word_data[word]

html = ''

# Bin words into groups of nearest 0.1 pct (* 10 to keep as integer)
bins = {}
for word in word_data:
    # Round mean percent to nearest 0.1
    bin = int(round(word_data[word]['mean_pct'] * 10))
    if bin not in bins:
        bins[bin] = []
    bins[bin].append(word)
# Create vector equi-spaced bins
all_bins = range(max(bins.keys()), min(bins.keys()) - 1, -1)

# Add y-axis labels
html += """Sale price relative to asking
<div class="row-fluid">
  <div class="span1 muted" style="line-height: 2.5;">
"""
for bin in all_bins:
    html += '%+.1f%%' % (bin / 10.,)
    html += '<br />'
html += '</div>'

# Draw word bubbles
html += '<div class="span11" style="text-align: center; line-height: 2.5;">'
for bin in all_bins:
    # Define color of word bubble
    if bin > 0:
        # Increasingly blue for higher pct
        color = 'hsl(200, 100%%, %d%%)' % (95 - bin,)
    elif bin < 0:
        # Increasingly red for lower pct
        color = 'hsl(0, 100%%, %d%%)' % (95 + bin,)
    else:
        # Gray if pct = 0
        color = 'hsl(0, 0%, 90%)'
    if bin not in bins:
        # If there are no words in this bin, skip drawing any bubbles
        html += '<br />'
        continue
    # OK, there are some words to draw!
    for word in bins[bin]:
        # Get a random sample of the concordances for this word
        random.shuffle(word_data[word]['concordances'])
        concordance = ''.join(word_data[word]['concordances'][:8])
        concordance = concordance.replace('"', "'")
        # Draw the bubble with concordance as a tooltip
        html += """<span style="background-color:%s;
padding:10px; border-radius:15px;"
title="%s">%s</span>""" % (color, concordance, word)
    html += "<br />"
html += """</div>
</div>
"""

print html

```