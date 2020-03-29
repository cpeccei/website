---
title: Solving Doublets in Python
---

[&larr; Back to main page](/)

July 11, 2015

This is a follow-up to an article I wrote a few years ago on
[Solving Doublets in Mathematica](/doublets/).

Doublets are a type of word puzzle invented by Lewis Carroll (author of
"Alice in Wonderland"). The goal is to change one word into another by
adding, removing, or changing one letter at a time. The tricky part is
that each intermediate step must also be a valid word. For more
information see this Wikipedia article on
[word ladders](https://en.wikipedia.org/wiki/Word_ladder). Here's an example
from that page:

COLD &rarr; CO**R**D &rarr; C**A**RD &rarr; **W**ARD &rarr; WAR**M**

If we think of words as vertices in a graph then two words are
connected by an edge if they differ by exactly one character. Once we have a
graph of connected words we can use a shortest path algorithm to solve
for doublets. We'll solve this in Python 2.7 using the
[NetworkX](https://networkx.github.io/) graph
library. I highly recommend using the
[Anaconda](https://store.continuum.io/cshop/anaconda/) Python distribution
which includes NetworkX and many other useful packages for data science.

First let's import the packages we'll need and define a function
`differ_by_one` that returns True if two words differ by exactly one
character and False otherwise. Note that we could simply check that the
[Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance)
between the two words equals 1 but that algorithm is overkill for what we
need here and runs much more slowly than the custom function below.

```python
import re
import itertools
import urllib2
import networkx

def differ_by_one(word1, word2):
    # Make sure word1 is shorter or equal in length to word2
    if len(word2) < len(word1):
        word1, word2 = word2, word1
    if len(word2) - len(word1) > 1:
        # Words differ in length by 2 or more characters so return False
        return False
    elif len(word1) == len(word2):
        # Words are same length so check how many characters are different
        # and return True if exactly one
        n_chars_diff = sum(c1 != c2 for c1, c2 in zip(word1, word2))
        return n_chars_diff == 1
    else:
        # word2 is guaranteed to be one character longer than word1.
        # Chop out one character at a time from word2 and compare to word1.
        for i in range(len(word2)):
            word2_shortened = word2[:i] + word2[i + 1:]
            if word1 == word2_shortened:
                return True
        return False
```

Now let's get a list of 5-letter words and compute which ones are connected
to each other. If two words are connected we'll add them to our graph.

```python
# Compile list of all lowercase words with up to 5 letters.
response = urllib2.urlopen(
    'http://s3-us-west-1.amazonaws.com/cpeccei-public/words.txt')
words = [word for word in response.read().splitlines()
    if re.search('^[a-z]{,5}$', word)]

g = networkx.Graph()
for word1, word2 in itertools.combinations(words, 2):
    if differ_by_one(word1, word2):
        g.add_edge(word1, word2)
```

Now if we want to solve a doublet between two words we just do:

```python
networkx.shortest_path(g, 'hello', 'world')
```

Which in this case returns:

```python
['hello', 'hell', 'held', 'hold', 'cold', 'cord', 'word', 'world']
```

NetworkX makes this so nice and simple. For fun we can compute some
doublets that turn words into their opposites (i.e. antonyms).

```python
# From http://www.michigan-proficiency-exams.com/antonym-list.html
response = urllib2.urlopen(
    'http://s3-us-west-1.amazonaws.com/cpeccei-public/antonyms.txt')
antonyms = [line.split() for line in response.read().splitlines()]

antonym_paths = set()
for word1, word2 in antonyms:
    if word1 in g and word2 in g:
        try:
            path = networkx.shortest_path(g, word1, word2)
            antonym_paths.add(tuple(path))
        except networkx.exception.NetworkXNoPath:
            pass

with open('antonym_paths.html', 'w') as f:
    for p in sorted(antonym_paths, key=len, reverse=True):
        f.write('<p><b>{}</b> to <b>{}</b><br />{}</p>\n'.format(p[0], p[-1],
            ' &rarr; '.join(p)))
```

Which returns:

<p><b>heavy</b> to <b>light</b><br />heavy &rarr; heady &rarr; beady &rarr; bead &rarr; beat &rarr; begat &rarr; begot &rarr; bigot &rarr; bight &rarr; light</p>
<p><b>noisy</b> to <b>quiet</b><br />noisy &rarr; nosy &rarr; nose &rarr; note &rarr; nite &rarr; site &rarr; suite &rarr; quite &rarr; quit &rarr; quiet</p>
<p><b>right</b> to <b>wrong</b><br />right &rarr; sight &rarr; sighs &rarr; signs &rarr; sins &rarr; sing &rarr; ring &rarr; wring &rarr; wrong</p>
<p><b>night</b> to <b>day</b><br />night &rarr; nigh &rarr; sigh &rarr; sign &rarr; sin &rarr; pin &rarr; pan &rarr; pay &rarr; day</p>
<p><b>tight</b> to <b>slack</b><br />tight &rarr; sight &rarr; sighs &rarr; signs &rarr; sins &rarr; sics &rarr; sacs &rarr; sack &rarr; slack</p>
<p><b>clear</b> to <b>vague</b><br />clear &rarr; clean &rarr; clan &rarr; can &rarr; cane &rarr; cage &rarr; age &rarr; ague &rarr; vague</p>
<p><b>dark</b> to <b>light</b><br />dark &rarr; dank &rarr; sank &rarr; sink &rarr; sins &rarr; signs &rarr; sighs &rarr; sight &rarr; light</p>
<p><b>light</b> to <b>dark</b><br />light &rarr; sight &rarr; sighs &rarr; signs &rarr; sins &rarr; sink &rarr; sank &rarr; dank &rarr; dark</p>
<p><b>fresh</b> to <b>stale</b><br />fresh &rarr; flesh &rarr; flash &rarr; flask &rarr; flak &rarr; flake &rarr; slake &rarr; stake &rarr; stale</p>
<p><b>below</b> to <b>above</b><br />below &rarr; blow &rarr; bow &rarr; boy &rarr; body &rarr; bode &rarr; abode &rarr; above</p>
<p><b>glad</b> to <b>sorry</b><br />glad &rarr; goad &rarr; good &rarr; wood &rarr; woody &rarr; wordy &rarr; worry &rarr; sorry</p>
<p><b>sober</b> to <b>drunk</b><br />sober &rarr; saber &rarr; saner &rarr; sane &rarr; sank &rarr; sunk &rarr; dunk &rarr; drunk</p>
<p><b>left</b> to <b>right</b><br />left &rarr; lest &rarr; best &rarr; besot &rarr; begot &rarr; bigot &rarr; bight &rarr; right</p>
<p><b>best</b> to <b>worst</b><br />best &rarr; lest &rarr; lost &rarr; host &rarr; hose &rarr; horse &rarr; worse &rarr; worst</p>
<p><b>blunt</b> to <b>sharp</b><br />blunt &rarr; bunt &rarr; hunt &rarr; hurt &rarr; hart &rarr; harp &rarr; sharp</p>
<p><b>bless</b> to <b>curse</b><br />bless &rarr; less &rarr; mess &rarr; muss &rarr; cuss &rarr; curs &rarr; curse</p>
<p><b>big</b> to <b>small</b><br />big &rarr; bid &rarr; mid &rarr; mil &rarr; mail &rarr; mall &rarr; small</p>
<p><b>alive</b> to <b>dead</b><br />alive &rarr; live &rarr; lie &rarr; lid &rarr; did &rarr; dad &rarr; dead</p>
<p><b>dull</b> to <b>clear</b><br />dull &rarr; dell &rarr; deal &rarr; dean &rarr; lean &rarr; clean &rarr; clear</p>
<p><b>tall</b> to <b>short</b><br />tall &rarr; tale &rarr; tare &rarr; hare &rarr; share &rarr; shore &rarr; short</p>
<p><b>rapid</b> to <b>slow</b><br />rapid &rarr; raid &rarr; said &rarr; slid &rarr; slit &rarr; slot &rarr; slow</p>
<p><b>low</b> to <b>high</b><br />low &rarr; sow &rarr; son &rarr; sin &rarr; sign &rarr; sigh &rarr; high</p>
<p><b>rich</b> to <b>poor</b><br />rich &rarr; rick &rarr; rock &rarr; rook &rarr; book &rarr; boor &rarr; poor</p>
<p><b>cruel</b> to <b>kind</b><br />cruel &rarr; creel &rarr; creed &rarr; reed &rarr; rend &rarr; rind &rarr; kind</p>
<p><b>dusk</b> to <b>dawn</b><br />dusk &rarr; dunk &rarr; dun &rarr; don &rarr; down &rarr; dawn</p>
<p><b>bold</b> to <b>timid</b><br />bold &rarr; told &rarr; toed &rarr; tied &rarr; timed &rarr; timid</p>
<p><b>stand</b> to <b>lie</b><br />stand &rarr; staid &rarr; said &rarr; slid &rarr; lid &rarr; lie</p>
<p><b>early</b> to <b>late</b><br />early &rarr; earl &rarr; ears &rarr; eats &rarr; lats &rarr; late</p>
<p><b>loss</b> to <b>find</b><br />loss &rarr; less &rarr; lens &rarr; lend &rarr; fend &rarr; find</p>
<p><b>long</b> to <b>short</b><br />long &rarr; lone &rarr; lore &rarr; sore &rarr; sort &rarr; short</p>
<p><b>up</b> to <b>down</b><br />up &rarr; uh &rarr; oh &rarr; on &rarr; own &rarr; down</p>
<p><b>fast</b> to <b>slow</b><br />fast &rarr; fat &rarr; flat &rarr; slat &rarr; slot &rarr; slow</p>
<p><b>new</b> to <b>old</b><br />new &rarr; now &rarr; nod &rarr; god &rarr; gold &rarr; old</p>
<p><b>found</b> to <b>lost</b><br />found &rarr; fount &rarr; font &rarr; foot &rarr; loot &rarr; lost</p>
<p><b>slim</b> to <b>thick</b><br />slim &rarr; shim &rarr; shin &rarr; thin &rarr; think &rarr; thick</p>
<p><b>open</b> to <b>shut</b><br />open &rarr; pen &rarr; pun &rarr; spun &rarr; shun &rarr; shut</p>
<p><b>happy</b> to <b>sad</b><br />happy &rarr; harpy &rarr; hardy &rarr; hard &rarr; had &rarr; sad</p>
<p><b>sour</b> to <b>sweet</b><br />sour &rarr; soar &rarr; sear &rarr; swear &rarr; sweat &rarr; sweet</p>
<p><b>odd</b> to <b>even</b><br />odd &rarr; ode &rarr; owe &rarr; ewe &rarr; eve &rarr; even</p>
<p><b>dry</b> to <b>wet</b><br />dry &rarr; cry &rarr; coy &rarr; cot &rarr; wot &rarr; wet</p>
<p><b>hard</b> to <b>soft</b><br />hard &rarr; hart &rarr; tart &rarr; tort &rarr; sort &rarr; soft</p>
<p><b>tame</b> to <b>wild</b><br />tame &rarr; time &rarr; tile &rarr; wile &rarr; wild</p>
<p><b>sow</b> to <b>reap</b><br />sow &rarr; sop &rarr; sap &rarr; rap &rarr; reap</p>
<p><b>out</b> to <b>in</b><br />out &rarr; but &rarr; bun &rarr; bin &rarr; in</p>
<p><b>few</b> to <b>many</b><br />few &rarr; fen &rarr; men &rarr; man &rarr; many</p>
<p><b>find</b> to <b>lose</b><br />find &rarr; fine &rarr; line &rarr; lone &rarr; lose</p>
<p><b>land</b> to <b>sea</b><br />land &rarr; lad &rarr; lead &rarr; lea &rarr; sea</p>
<p><b>peace</b> to <b>war</b><br />peace &rarr; pace &rarr; pare &rarr; par &rarr; war</p>
<p><b>fat</b> to <b>thin</b><br />fat &rarr; tat &rarr; tan &rarr; tin &rarr; thin</p>
<p><b>less</b> to <b>more</b><br />less &rarr; loss &rarr; lose &rarr; lore &rarr; more</p>
<p><b>guest</b> to <b>host</b><br />guest &rarr; gust &rarr; lust &rarr; lost &rarr; host</p>
<p><b>take</b> to <b>give</b><br />take &rarr; hake &rarr; hike &rarr; hive &rarr; give</p>
<p><b>come</b> to <b>go</b><br />come &rarr; code &rarr; cod &rarr; god &rarr; go</p>
<p><b>loud</b> to <b>soft</b><br />loud &rarr; lout &rarr; loft &rarr; soft</p>
<p><b>hate</b> to <b>love</b><br />hate &rarr; have &rarr; hove &rarr; love</p>
<p><b>mad</b> to <b>sane</b><br />mad &rarr; sad &rarr; sand &rarr; sane</p>
<p><b>last</b> to <b>first</b><br />last &rarr; list &rarr; fist &rarr; first</p>
<p><b>bad</b> to <b>good</b><br />bad &rarr; gad &rarr; god &rarr; good</p>
<p><b>cold</b> to <b>hot</b><br />cold &rarr; colt &rarr; cot &rarr; hot</p>
<p><b>cheap</b> to <b>dear</b><br />cheap &rarr; heap &rarr; hear &rarr; dear</p>
<p><b>first</b> to <b>last</b><br />first &rarr; fist &rarr; list &rarr; last</p>
<p><b>me</b> to <b>you</b><br />me &rarr; ye &rarr; yo &rarr; you</p>
<p><b>near</b> to <b>far</b><br />near &rarr; fear &rarr; far</p>
<p><b>thick</b> to <b>thin</b><br />thick &rarr; think &rarr; thin</p>
<p><b>wax</b> to <b>wane</b><br />wax &rarr; wan &rarr; wane</p>
<p><b>here</b> to <b>there</b><br />here &rarr; there</p>
