Injects your friends' movie ratings into iMDB pages.
Also gives you a list of your friends' recently rated movies (click on the extension icon).

*First, I want to take this chance to make a public announcement:*

##PA##

1. Tabs are the way to go, screw all of you byte wasting inflexible haters!
2. Hard wrapping (esp. at 80 chars) is for people with weak code editors!

*Now on to the house keeping:*

#TODO#

- use a proper CSV parser (although our's is probably pretty fast compared to full featured ones)
- switch from localStorage to indexed DB (at least for the user/friend cache data)
- remove code wrappings in some of the .js files (this shouldn't be needed in Chrome Extensions afaik, as they're running in their own environment anyway)
- handle invalid/inaccessable user names better (maybe add a marker in options.html to usernames who's export data cannot be accessed; at the moment the user isn't really informed about this, except he'll never see that user listed with ratings)
- tidy up the html generator functions, they look like dead babies in a blender.
- add more useful comments, remove those that are less useful.
- maek evurathing moa purtteh!

#MIGHTDO#

- create a simple web service that serves as a proxy for the export lists; we could even optimize then, only download the data we really need, not all that crap that we throw away atm. But that would mean a lot more investment.
