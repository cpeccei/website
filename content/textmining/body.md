---
title: Python Textmining Package
---

[&larr; Back to main page](/)

## Overview

This package contains a variety of useful functions for text mining in Python.
It focuses on statistical text mining (i.e. the bag-of-words model) and makes it
very easy to create a term-document matrix from a collection of documents. This
matrix can then be read into a statistical package (R, MATLAB, etc.) for further
analysis. The package also provides some useful utilities for finding
collocations (i.e. significant two-word phrases), computing the edit distance
between words, and chunking long documents up into smaller pieces.

The package has a large amount of curated data (stopwords, common names, an
English dictionary with parts of speech and word frequencies) which allows the
user to extract fairly sophisticated features from a document.

This package does NOT have any natural language processing capabilities such as
part-of-speech tagging. Please see the Python NLTK for that sort of
functionality (plus much, much more).

## Installation

The [latest version (1.0)](http://pypi.python.org/pypi/textmining/1.0) is
available from the Python Package Index.

To install, either run `pip install textmining` or download and
extract the .zip file and run `python setup.py install`.

## Examples

The most common use of the textmining package is to create a term-document
matrix for analysis with a statistical package such as R or MATLAB. Here is a
simple example:

```python
import textmining

def termdocumentmatrix_example():
    # Create some very short sample documents
    doc1 = 'John and Bob are brothers.'
    doc2 = 'John went to the store. The store was closed.'
    doc3 = 'Bob went to the store too.'
    # Initialize class to create term-document matrix
    tdm = textmining.TermDocumentMatrix()
    # Add the documents
    tdm.add_doc(doc1)
    tdm.add_doc(doc2)
    tdm.add_doc(doc3)
    # Write out the matrix to a csv file. Note that setting cutoff=1 means
    # that words which appear in 1 or more documents will be included in
    # the output (i.e. every word will appear in the output). The default
    # for cutoff is 2, since we usually aren't interested in words which
    # appear in a single document. For this example we want to see all
    # words however, hence cutoff=1.
    tdm.write_csv('matrix.csv', cutoff=1)
    # Instead of writing out the matrix you can also access its rows directly.
    # Let's print them to the screen.
    for row in tdm.rows(cutoff=1):
        print row
```

In addition to writing the term-document matrix to a CSV file, this code also prints the rows of the matrix to the screen:

```python
['and', 'the', 'brothers', 'to', 'are', 'closed', 'bob', 'john', 'was', 'went', 'store', 'too']
[1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0]
[0, 2, 0, 1, 0, 1, 0, 1, 1, 1, 2, 0]
[0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1]
```

Please see the 'examples' directory in the package file for other sample applications.

