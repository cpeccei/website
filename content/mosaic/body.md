---
title: Preparing Images for a Photomosaic
---

[&larr; Back to main page](/)

A photomosaic is a collection of small images that combine together to form a
larger picture when viewed from a distance. Here is a famous example:

![Mona Lisa photomosaic](monalisa.jpg)

There are many software packages available to produce photomosaics (I like
[Metapixel](http://www.complang.tuwien.ac.at/schani/metapixel/) for Linux
and [AndreaMosaic](http://www.andreaplanet.com/andreamosaic/) for Windows)
but the quality of the output greatly depends on the set of input photos. The
photomosaic will be much more visually entertaining if your input photos are as
different as possible from each other. With digital cameras it is really easy to
end up with eight near- duplicate shots of a single scene which makes for a very
repetitive photomosaic.

Another consideration is the aspect ratio of the input files; since the tiles in
a photomosaic must all be the same size the software usually rescales images so
they are all identical in width and height. This can produce poor results if you
have a mixture of landscape and portrait photos, since one or the other will get
squashed to fit the tile size of the photomosaic.

I encountered both of these issues when trying to create a mosaic of our
vacation photos. Since I had been playing around with the
[Python Imaging Library](http://www.pythonware.com/products/pil/)
I decided to write a quick script to prepare a set of photos for input into a
photomosaic package. Here were the requirements:

- Process multiple directories of input photos
- Exclude duplicate (or near duplicate) photos
- Crop (don't rescale) photos to a standard size
- Output a new set of photos with unique filenames

Here's the script (with plenty of comments):

```python
import Image
import glob
import os
import time
import shutil

INPUTS = ['C:/Users/Christian/Pictures/italy2009_1/*.JPG',
          'C:/Users/Christian/Pictures/italy2009_2/*.JPG']
BASE_OUTPUT_DIR = 'C:/mosaictest'
SIMILARITY_THRESHOLD = 9000

THUMBNAIL_WIDTH = 400
THUMBNAIL_HEIGHT = 300

# ============================================================================

def create_thumbnail(im, th_width, th_height):
    '''im is a PIL image object, th_width and th_height are integers
describing the desired width and height in pixels of the thumbnail.
The function returns a PIL image object representing the thumbnail'''

    im_width, im_height = float(im.size[0]), float(im.size[1])
    th_width, th_height = float(th_width), float(th_height)

    im_aspect_ratio = im_width / im_height
    th_aspect_ratio = th_width / th_height

    if im_aspect_ratio < th_aspect_ratio:
        # Crop off bands along top and bottom of original image
        scaled_th_height = im_width / th_width * th_height
        crop_band = (im_height - scaled_th_height) / 2
        box = (0, int(crop_band), int(im_width), int(im_height - crop_band))
    else:
        # Crop off bands along left and right of original image
        scaled_th_width = im_height / th_height * th_width
        crop_band = (im_width - scaled_th_width) / 2
        box = (int(crop_band), 0, int(im_width - crop_band), int(im_height))
    region = im.crop(box)
    return region.resize((int(th_width), int(th_height)), Image.ANTIALIAS)

# ============================================================================

def image_dist(im1, im2):
    '''An extremely crude distance function between two images. If the two
images are identical this will return 0. If they are fairly close in the
RGB values of their pixels the distance will be around 8000. If they are
really different the distance will be around 15000.'''

    d = 0.
    for p1, p2 in zip(im1.getdata(), im2.getdata()):
        for v1, v2 in zip(p1, p2):
            d += (v1 - v2)**2
    return d / (im1.size[0] * im1.size[1])

# ============================================================================

# Get list of input files
input_files = []
for d in INPUTS:
    input_files.extend(glob.glob(d))
input_files.sort()
input_files = input_files[:30]

# Create timestamped name for output directory
time_str = time.strftime('%Y-%m-%d-%H-%M-%S', time.localtime())
output_dir = os.path.join(BASE_OUTPUT_DIR, 'Photos-' + time_str)

# Create output directory if it doesn't exist
os.mkdir(output_dir)

# Copy files over to output directory with consecutive names
i = 0
prev_th = None
for (count, input_file) in enumerate(input_files):
    print 'Processing', count + 1, 'of', len(input_files)
    try:
        im = Image.open(input_file)
    except IOError:
        continue
    # Get extension of current file
    (root, ext) = os.path.splitext(input_file)
    ext = ext.lower()
    # Get thumbnail dimensions
    th = create_thumbnail(im, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
    # Get "distance" from previous thumbnail in the list of input files.
    # If the distance is above a certain threshold the images are
    # considered different and the new image is processed for inclusion
    # in the photomosaic. Note that this logic will not identify
    # similar-looking images that do not appear next to each other in filename
    # order. To do this you would need a full deduping algorithm which
    # would be considerably more complex.
    if prev_th is not None:
        d = image_dist(th, prev_th)
        if d > SIMILARITY_THRESHOLD:
            # Resize image
            i += 1
            output_name = '%04d.%s' % (i, "jpg")
            prev_th.save(os.path.join(output_dir, output_name))
    prev_th = th
# Make sure we don't forget about the last image in the list!
i += 1
output_name = '%04d.%s' % (i, "jpg")
prev_th.save(os.path.join(output_dir, output_name))
```

The output directory will now contain a nice set of deduped, resized and renamed
images which can be fed straight into your photomosaic software. Here is the
final output I created using Metapixel:

![Wombat photomosaic](mosaic.jpg)

In case you're wondering about the silhouette, it's a profile picture of
a wombat!
