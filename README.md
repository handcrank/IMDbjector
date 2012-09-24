It's thing that does a thing and parts of it work well and others don't.

*First, I want to take this chance to make a public announcement:*

##PA##

1. Tabs are the way to go, screw all of you byte wasting and inflexible haters!
2. Hard wrapping (esp. at 80 chars) is for people with weak code editors!

*Now on to the house keeping:*

#TODO#

- use a proper CSV parser (although our's is probably pretty fast compared to full featured ones)
- remove code wrappings in some of the .js files (this shouldn't be needed in Chrome Extensions afaik, as they're running in their own environment anyway)
- create a stylesheet for options.html
- handle invalid/inaccessable user names better (maybe add a marker in options.html to usernames who's export data cannot be accessed; at the moment the user isn't really informed about this, except he'll never see that user listed with ratings)
- parallel-ize score-data lookup/export list download. (had this parallel before we switched to ports for communication; should give a nice speed up)
- tidy up the html generator functions, they look like dead babies in a blender.
- add more useful comments, remove those that are less useful.
- maek evurathing moa purtteh!

#MIGHTDO#

- change the storage/cache format, right now we're storing new-line separated tuples ("movie-id:rating") as a simple string, we could change this to e.g. a JSON encoded object, which would then allow quick&easy lookup of the rating via movie-id; on the other hand it might actually be faster (and more memory efficient) to grep through the string than to unpack and lookup. Anyhow, this is really quite the non-issue, because it's not the part that's slow; the downloading of all the export data is.
- create a simple web service that serves as a proxy for the export lists; we could even optimize then, only download the data we really need, not all that crap that we throw away atm. But that would mean a lot more investment.
