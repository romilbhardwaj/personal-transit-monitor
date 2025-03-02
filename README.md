# personal-transit-monitor
Simple way to view what transit is coming at stops you frequent.

### INSTRUCTIONS ###

Build a personal transit tracker in a few minutes.

Just copy index.html. You can run this locally!

1. GET A 511 API KEY AND ENTER IT IN INDEX.HTML

a. Request a token at https://511.org/open-data/token. It looks like this "705e9e9b-0294-4ba2-8e6a-24718953301f" (this is expired; won't work). Requesting a token and getting it takes <60 seconds.

b. In the javascript, edit var apiKey = "YOUR_KEY";

c. Each API key has rate limits by default.

2. CUSTOMIZE THE LABELS, STOPS, AND LINE IN stopsAndLabels

For each stop / line combo you want to track:

a. Create your own label.

b. Find the Stop ID (easiest on Google Maps).

c. Optionally, enter the line (like "14" or "N"). This is used to only the timings from specific bus/train lines.

d. If you want to have have headers/titles, only have the label field (no stopId/line), and it'll show bold.

DONE!
