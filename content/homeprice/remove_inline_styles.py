import sys
from html.parser import HTMLParser

class MyHTMLParser(HTMLParser):

    def __init__(self):
        super().__init__()
        self.styles = {}

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        if 'style' in attr_dict:
            classname = 'inline-style-' + str(len(self.styles))
            self.styles[classname] = attr_dict['style']
            classes = attr_dict.get('class', '').split()
            classes.append(classname)
            attr_dict['class'] = ' '.join(classes)
            del attr_dict['style']
        if attrs:
            attr_str = ''.join(' {}="{}"'.format(k, v.replace('"', '&quot;'))
                for k, v in attr_dict.items())
        else:
            attr_str = ''
        print('<{}{}>'.format(tag, attr_str))

    def handle_endtag(self, tag):
        if tag != 'br':
            print('</{}>'.format(tag))

    def handle_data(self, data):
        print(data)

parser = MyHTMLParser()
with open(sys.argv[1]) as f:
    inline_html = f.read()
parser.feed(inline_html)

print('=' * 72)
for classname, style in parser.styles.items():
    print('.' + classname + ' {' + style + '}')




