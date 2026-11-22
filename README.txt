WATCHON STREAMING WEBSITE

HOW TO OPEN
1. Extract (unzip) the WATCHON folder.
2. Double-click index.html. It opens in Microsoft Edge (or any browser).
   No Live Server or internet is needed. (Internet only loads the font.)

PAGES
index.html          Home
movies.html         Movies
series.html         Series (Youngins)
documentaries.html  Documentaries (Wild Africa)
browse.html         Browse and search
details.html        Title details  (opens as details.html?id=red-horizon)
watch.html          Watch page     (opens as watch.html?id=red-horizon)
my-list.html        My List
signin.html         Sign in
profile.html        Profile
plans.html          Plans
about.html          About
help.html           Help Centre
contact.html        Contact
privacy.html        Privacy Policy
terms.html          Terms of Service
cookies.html        Cookie Policy

FOLDERS
css/style.css        All the styling
js/site.js           Makes the buttons, search, My List and forms work
data/catalogue.js    THE CATALOGUE the pages use (all titles)
data/catalogue.json  Same catalogue as plain JSON (for reference)
images/              All the pictures (posters, categories, home photo)
videos/              Put your video files here

ADD A VIDEO
Put the video file in the videos folder with EXACTLY this name
(same capital letters and spaces; use .mp4):
  Blue Orbit.mp4        City Beats.mp4       Laugh Track.mp4
  Little Comet.mp4      Night Signal.mp4     Open Road.mp4
  Red Horizon.mp4       Summer Lights.mp4    The Hidden Room.mp4
  The Last Recipe.mp4   The Quiet River.mp4  Wild Earth.mp4
  wild animal.mp4       Wild Africa documentary (Documentaries page)
  youngings.mp4         Youngins (Series page)
  boyka.mp4             "Watch Boyka" button on the Home page
(.webm, .mov and .m4v with the same name also work.)
Every title plays only its own video. A title with no video file shows the
empty "Video space" box.
When the website is hosted online, file names are case-sensitive:
"Blue Orbit.mp4" is not the same as "blue orbit.mp4".

For any new title: open data/catalogue.js and change  "video": ""  to
"video": "videos/your-file.mp4". Do the same in data/catalogue.json.
Use only videos you own or have permission to show.


Replace the file in the images folder with your own picture using the
same file name, or change the "poster" path in data/catalogue.js.

NOTES
My List, profile and cookie choices are saved in this browser only.
Sign in is a simple local profile, not a secure account.
The contact form and plans do not send messages or take payments yet.

BOOTSTRAP AND FETCH (added for the assignment)
- Bootstrap is used on about.html and signin.html (grid, cards, badges, alerts,
  buttons, modals, utilities). It is in css/bootstrap-scoped.css and
  js/bootstrap.bundle.min.js and only affects elements inside <div class="bs-scope">.
- The catalogue is loaded with fetch() from data/catalogue.json (js/site.js).
  If it cannot be fetched (for example when a page is opened by double-clicking
  the file), data/catalogue.js is used as the fallback and a short notice is shown.
  Keep data/catalogue.json and data/catalogue.js the same.


OMDb CONNECTION
1. Open js/omdb-config.js.
2. Replace PASTE_YOUR_OMDB_API_KEY_HERE with your activated OMDb API key.
3. Save the file and open index.html.
4. Open Browse to see the 20 extra OMDb movie entries.
   OMDb provides movie information and posters, not movie video files.
   The 20 extra entries therefore show the Video space unless you add
   a video file that you own or have permission to use.

The OMDb results are cached in this browser for 7 days to reduce API requests.
The original 14 catalogue entries and their video paths are kept unchanged.
The provided ZIP did not contain a videos folder or video files, so add your
original video files back into WATCHON/videos using the existing file names
if you want local playback.

LOGO
The supplied WATCHON logo is saved as images/logo.png and is used in the
website header.
