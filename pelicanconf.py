#!/usr/bin/env python
# -*- coding: utf-8 -*- #
from __future__ import unicode_literals

AUTHOR = u'Christian Peccei'
SITENAME = u"Christian Peccei's Website"
SITEURL = ''

PATH = 'content'

TIMEZONE = 'US/Pacific'

DEFAULT_LANG = u'en'

# Feed generation is usually not desired when developing
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

# Blogroll
# LINKS = (('Pelican', 'http://getpelican.com/'),
#          ('Python.org', 'http://python.org/'),
#          ('Jinja2', 'http://jinja.pocoo.org/'),
#          ('You can modify those links in your config file', '#'),)

# # Social widget
# SOCIAL = (('You can add links in your config file', '#'),
#           ('Another social link', '#'),)

DEFAULT_PAGINATION = 10

# Uncomment following line if you want document-relative URLs when developing
#RELATIVE_URLS = True

ARTICLE_URL = '{slug}/'
ARTICLE_SAVE_AS = '{slug}/index.html'

MD_EXTENSIONS = {'markdown.extensions.tables': {},
                 'markdown.extensions.fenced_code': {},
                 'markdown.extensions.codehilite': {}}

LOAD_CONTENT_CACHE = False
STATIC_PATHS = ['static']
