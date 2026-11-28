/* WATCHON - plain browser version. Works by double-clicking any .html file. */
(function () {
  "use strict";

  var CATALOGUE = [];
  var CATALOGUE_URL = "data/catalogue.json";
  var NEEDS_CATALOGUE = { browse: true, details: true, watch: true, "my-list": true };
  var KEYS = {
    list: "logowebMyList",
    user: "logowebUser",
    progress: "logowebProgress",
    cookies: "watchonCookiePreferences"
  };

  var page = document.body.getAttribute("data-page");
  var params = new URLSearchParams(location.search);

  /* ---------- helpers ---------- */

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c];
    });
  }

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      if (value == null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      /* storage unavailable */
    }
  }

  function getList() {
    var l = readJSON(KEYS.list, []);
    return Array.isArray(l) ? l.map(String) : [];
  }

  function getUser() {
    var u = readJSON(KEYS.user, null);
    return u && u.name && u.email ? u : null;
  }

  function getTitle(id) {
    for (var i = 0; i < CATALOGUE.length; i++) {
      if (CATALOGUE[i].id === id) return CATALOGUE[i];
    }
    return null;
  }

  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
  }

  function firstName(n) {
    return n ? String(n).trim().split(/\s+/)[0] : "";
  }

  var ICON = {
    plus: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>',

    check: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>',

    play: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play" aria-hidden="true"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path></svg>',

    plusBig: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus mx-auto mb-2 h-8 w-8" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>',

    x: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',

    menu: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu" aria-hidden="true"><path d="M4 5h16"></path><path d="M4 12h16"></path><path d="M4 19h16"></path></svg>',

    up: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up" aria-hidden="true"><path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path></svg>'
  };

  /* ---------- Button styles ---------- */

  var BTN = "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

  var VARIANT = {
    primary: "bg-primary text-primary-foreground shadow hover:bg-primary-hover",
    brandOutline: "border border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground",
    outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
  };

  var SIZE = {
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-12 rounded-lg px-7 text-[15px]",
    md: "rounded-lg text-sm h-9 px-4 py-2"
  };

  function btn(variant, size, extra) {
    return [BTN, VARIANT[variant], SIZE[size], extra || ""].join(" ");
  }

  /* ---------- toast ---------- */

  function toast(msg) {
    var wrap = document.querySelector(".wo-toast-wrap");

    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "wo-toast-wrap";
      wrap.setAttribute("aria-live", "polite");
      document.body.appendChild(wrap);
    }

    var t = document.createElement("div");
    t.className = "wo-toast";
    t.textContent = msg;
    wrap.appendChild(t);

    setTimeout(function () {
      t.remove();
    }, 3500);
  }

  /* ---------- pieces ---------- */

  function poster(t, cls) {
    return '<div class="relative overflow-hidden bg-muted ' + cls + '">' +
      (t.poster
        ? '<img src="' + esc(t.poster) + '" alt="' + esc(t.title) + ' poster" loading="lazy" width="768" height="1152" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105">'
        : '<span class="absolute inset-0 grid place-items-center p-4 text-center font-extrabold">' + esc(t.title) + "</span>") +
      "</div>";
  }

  function listButton(t, variant, size, extra) {
    return '<button type="button" aria-pressed="false" data-list-id="' + esc(t.id) + '" class="' + btn(variant, size, extra) + '">' +
      ICON.plus + "My List</button>";
  }

  function card(t) {
    var label = t.type === t.genre ? t.type : t.type + " · " + t.genre;

    return '<article class="group flex flex-col">' +
      '<a class="block" href="details.html?id=' + encodeURIComponent(t.id) + '">' +
      poster(t, "aspect-[2/3] rounded-xl shadow-card transition-shadow group-hover:shadow-lift") +
      '<p class="eyebrow mt-3 text-[10px]">' + esc(label) + "</p>" +
      '<h3 class="mt-1 text-[15px] font-bold leading-snug group-hover:text-primary">' + esc(t.title) + "</h3>" +
      '<p class="text-xs text-muted-foreground">' + esc(t.year) + " · " + esc(t.duration) + "</p></a>" +
      listButton(t, "outline", "sm", "mt-3 self-start") +
      "</article>";
  }

  function grid(titles) {
    return '<div class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">' +
      titles.map(card).join("") +
      "</div>";
  }

  function emptyState(title, body, action) {
    return '<div class="rounded-2xl border-2 border-dashed p-10 text-center">' +
      '<h2 class="text-xl font-extrabold">' + esc(title) + "</h2>" +
      (body ? '<div class="mx-auto mt-2 max-w-md text-sm text-muted-foreground">' + body + "</div>" : "") +
      (action ? '<div class="mt-5 flex justify-center">' + action + "</div>" : "") +
      "</div>";
  }

  function notFound() {
    return '<div class="container mx-auto px-4 py-12">' +
      emptyState(
        "Title not found",
        "Please select a title from Browse.",
        '<a class="' + btn("primary", "md") + '" href="browse.html">Browse titles</a>'
      ) +
      "</div>";
  }

  /* ---------- video files ---------- */

  var VIDEO_ALIASES = {
    "wild-africa": [
      "videos/Wild Africa.mp4",
      "videos/wild africa.mp4"
    ],

    "youngins": [
      "videos/youngins.mp4",
      "videos/Youngins.mp4",
      "videos/17 ART TauFromark.mp4"
    ]
  };

  function videoSources(path, id) {
    var paths = [path].concat(VIDEO_ALIASES[id] || []);
    var tags = [];

    paths.forEach(function (p) {
      var base = p.replace(/\.[^.\/]+$/, "");
      var exts = [p.split(".").pop().toLowerCase()];

      ["mp4", "webm", "mov", "m4v"].forEach(function (e) {
        if (exts.indexOf(e) < 0) exts.push(e);
      });

      exts.forEach(function (e) {
        tags.push('<source src="' + esc(base + "." + e) + '">');
      });
    });

    return tags.join("");
  }

  function videoSlot(label, extra) {
    return '<div role="img" aria-label="Video space for ' + esc(label) + '" class="video-slot aspect-video w-full ' + (extra || "") + '">' +
      '<span class="video-slot-label">Video space</span>' +
      "</div>";
  }

  /* ---------- My List buttons ---------- */

  function refreshListButtons() {
    var list = getList();

    document.querySelectorAll("[data-list-id]").forEach(function (b) {
      var saved = list.indexOf(b.getAttribute("data-list-id")) !== -1;

      b.setAttribute("aria-pressed", saved ? "true" : "false");
      b.innerHTML = (saved ? ICON.check : ICON.plus) +
        (saved ? "In My List" : "My List");
    });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-list-id]");
    if (!b) return;

    var id = b.getAttribute("data-list-id");
    var list = getList();

    var added = list.indexOf(id) === -1;

    list = added
      ? list.concat(id)
      : list.filter(function (x) {
          return x !== id;
        });

    writeJSON(KEYS.list, list);

    var t = getTitle(id);

    toast((t ? t.title : "Title") +
      (added ? " added to My List" : " removed from My List"));

    if (page === "my-list") renderMyList();

    refreshListButtons();
  });

  /* ---------- header ---------- */

  function setupHeader() {
    var user = getUser();

    var signin = document.querySelector('header a[href="signin.html"]');

    if (signin && user) {
      signin.href = "profile.html";
      signin.textContent = "Hi, " + firstName(user.name);
      signin.className = signin.className.replace(
        VARIANT.primary,
        VARIANT.brandOutline
      );
    }

    var menuBtn = document.querySelector('header button[aria-label="Open menu"]');
    var desktopNav = document.querySelector('header nav[aria-label="Main"]');

    if (!menuBtn || !desktopNav) return;

    var mobile = document.createElement("nav");
    mobile.setAttribute("aria-label", "Mobile");
    mobile.className = "border-t lg:hidden";
    mobile.hidden = true;

    var inner = '<div class="container mx-auto flex flex-col px-4 py-3">';

    desktopNav.querySelectorAll("a").forEach(function (a) {
      inner += a.outerHTML;
    });

    var linkCls = "rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground";

    inner += '<a class="' + linkCls + '" href="' +
      (user ? "profile.html" : "signin.html") + '">' +
      (user ? "Profile" : "Sign in") +
      "</a></div>";

    mobile.innerHTML = inner;
    document.querySelector("header").appendChild(mobile);

    menuBtn.addEventListener("click", function () {
      var open = mobile.hidden;

      mobile.hidden = !open;
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menuBtn.innerHTML = open ? ICON.x : ICON.menu;
    });
  }

  /* ---------- Browse ---------- */

  function filterTitles(f) {
    var term = (f.q || "").trim().toLowerCase();

    var found = CATALOGUE.filter(function (t) {
      var text = (
        t.title + " " +
        t.description + " " +
        t.genre + " " +
        t.type + " " +
        t.year
      ).toLowerCase();

      return (!term || text.indexOf(term) !== -1) &&
        (!f.genre || t.genre.toLowerCase() === f.genre.toLowerCase()) &&
        (!f.type || t.type.toLowerCase() === f.type.toLowerCase());
    });

    if (f.sort === "newest") {
      found.sort(function (a, b) {
        return b.year - a.year;
      });
    }

    if (f.sort === "az") {
      found.sort(function (a, b) {
        return a.title.localeCompare(b.title);
      });
    }

    return found;
  }

  function setupBrowse() {
    var state = {
      q: params.get("q") || "",
      genre: params.get("genre") || "",
      type: params.get("type") || "",
      sort: params.get("sort") || ""
    };

    var q = document.getElementById("searchInput");
    var g = document.getElementById("genreFilter");
    var ty = document.getElementById("typeFilter");
    var s = document.getElementById("sortFilter");

    if (state.genre && ![].some.call(g.options, function (o) {
      return o.value.toLowerCase() === state.genre.toLowerCase();
    })) {
      var o = document.createElement("option");
      o.value = state.genre;
      o.textContent = state.genre;
      g.appendChild(o);
    }

    function render() {
      q.value = state.q;

      g.value = [].map.call(g.options, function (o) {
        return o.value;
      }).filter(function (v) {
        return v && v.toLowerCase() === state.genre.toLowerCase();
      })[0] || "";

      ty.value = ["Movie", "Series", "Documentary"].filter(function (v) {
        return v.toLowerCase() === state.type.toLowerCase();
      })[0] || "";

      s.value = state.sort === "newest" || state.sort === "az"
        ? state.sort
        : "featured";

      document.querySelectorAll("#typeTabs [data-type]").forEach(function (b) {
        var active = b.getAttribute("data-type").toLowerCase() === state.type.toLowerCase();
        b.className = btn(active ? "primary" : "brandOutline", "sm");
      });

      var found = filterTitles(state);

      document.getElementById("resultCount").textContent =
        found.length + " title" + (found.length === 1 ? "" : "s") + " found";

      document.getElementById("results").innerHTML = found.length
        ? grid(found)
        : emptyState("No titles found", "Try another search or clear a filter.");

      refreshListButtons();

      var p = new URLSearchParams();

      ["q", "genre", "type", "sort"].forEach(function (k) {
        if (state[k] && !(k === "sort" && state[k] === "featured")) {
          p.set(k, state[k]);
        }
      });

      try {
        history.replaceState(
          null,
          "",
          location.pathname + (p.toString() ? "?" + p : "")
        );
      } catch (e) {
        /* ignore */
      }
    }

    document.getElementById("browseForm").addEventListener("submit", function (e) {
      e.preventDefault();
    });

    q.addEventListener("input", function () {
      state.q = q.value;
      render();
    });

    g.addEventListener("change", function () {
      state.genre = g.value;
      render();
    });

    ty.addEventListener("change", function () {
      state.type = ty.value;
      render();
    });

    s.addEventListener("change", function () {
      state.sort = s.value;
      render();
    });

    document.querySelectorAll("#typeTabs [data-type]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.type = b.getAttribute("data-type");
        render();
      });
    });

    render();
  }

  /* ---------- Title details ---------- */

  function relatedTitles(cur) {
    var same = CATALOGUE.filter(function (t) {
      return t.id !== cur.id && t.genre === cur.genre;
    });

    return (
      same.length
        ? same
        : CATALOGUE.filter(function (t) {
            return t.id !== cur.id;
          })
    ).slice(0, 4);
  }

  function renderDetails() {
    var root = document.getElementById("page-root");
    var m = getTitle(params.get("id") || "");

    if (!m) {
      root.innerHTML = notFound();
      document.title = "Title not found | WATCHON";
      return;
    }

    document.title = m.title + " | WATCHON";

    var stats = [
      ["Genre", m.genre],
      ["Format", m.type],
      ["Release year", m.year],
      ["Age rating", m.rating]
    ];

    /* Show the trailer button only for movies */
    var trailerButton = "";

    if (String(m.type).toLowerCase() === "movie") {
      var trailerUrl =
        "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(m.title + " " + m.year + " official trailer");

      trailerButton =
        '<a class="' + btn("brandOutline", "lg") +
        '" href="' + trailerUrl +
        '" target="_blank" rel="noopener noreferrer">' +
        ICON.play + " Watch Trailer</a>";
    }

    root.innerHTML =
      '<div class="container mx-auto px-4 py-8">' +

        '<div class="grid items-start gap-8 md:grid-cols-12">' +

          '<div class="md:col-span-4">' +
            poster(m, "aspect-[2/3] rounded-2xl shadow-lift") +
          "</div>" +

          '<div class="md:col-span-8 md:pt-4">' +

            '<p class="eyebrow mb-2">' +
              esc(m.type) + " · " + esc(m.genre) +
            "</p>" +

            '<h1 class="text-5xl font-extrabold tracking-tighter md:text-6xl">' +
              esc(m.title) +
            "</h1>" +

            '<p class="mt-3 text-sm text-muted-foreground">' +
              esc(m.year) + " · " +
              esc(m.duration) + " · " +
              esc(m.rating) +
            "</p>" +

            '<p class="mt-4 text-lg leading-8">' +
              esc(m.description) +
            "</p>" +

            '<div class="mt-6 flex flex-wrap gap-3">' +

              '<a class="' + btn("primary", "lg") +
              '" href="watch.html?id=' + encodeURIComponent(m.id) + '">' +
                ICON.play + " Watch now" +
              "</a>" +

              trailerButton +

              listButton(m, "brandOutline", "lg") +

            "</div>" +

            '<div class="mt-8 grid gap-3 sm:grid-cols-2">' +

              stats.map(function (s) {
                return '<div class="stat-box">' +
                  '<span class="text-xs text-muted-foreground">' +
                    esc(s[0]) +
                  '</span>' +
                  '<div class="font-bold">' +
                    esc(s[1]) +
                  "</div>" +
                "</div>";
              }).join("") +

            "</div>" +

            '<h2 class="mt-8 text-xl font-bold">About this title</h2>' +

            '<p class="mt-2 leading-7 text-muted-foreground">' +
              esc(m.description) +
            "</p>" +

          "</div>" +

        "</div>" +

        '<section class="mt-14">' +
          '<h2 class="mb-5 text-2xl font-extrabold">You may also like</h2>' +
          grid(relatedTitles(m)) +
        "</section>" +

      "</div>";
  }

  /* ---------- Watch ---------- */

  function renderWatch() {
    var root = document.getElementById("page-root");
    var m = getTitle(params.get("id") || "");

    if (!m) {
      root.innerHTML = notFound();
      return;
    }

    document.title = "Watch " + m.title + " | WATCHON";

    var player = m.video
      ? '<div class="relative aspect-video w-full overflow-hidden rounded-2xl bg-ink">' +
        '<video id="player" controls playsinline preload="metadata" poster="' +
        esc(m.poster) + '" aria-label="' + esc(m.title) +
        ' video" class="h-full w-full bg-ink object-contain">' +
        videoSources(m.video, m.id) +
        'Your browser does not support HTML video.</video></div>'
      : videoSlot(m.title);

    root.innerHTML =
      '<div class="container mx-auto max-w-5xl px-4 py-8">' +

        '<h1 class="mb-4 text-3xl font-extrabold">' +
          esc(m.title) +
        "</h1>" +

        '<div id="playerWrap">' +
          player +
        "</div>" +

        '<div class="mt-4 flex flex-wrap items-center justify-between gap-3">' +

          '<p class="text-sm text-muted-foreground">' +
            esc(m.genre) + " · " +
            esc(m.year) + " · " +
            esc(m.duration) +
          "</p>" +

          '<a class="' + btn("brandOutline", "md") +
          '" href="details.html?id=' + encodeURIComponent(m.id) + '">' +
            "Title details" +
          "</a>" +

        "</div>" +

        '<p class="mt-4 leading-7">' +
          esc(m.description) +
        "</p>" +

      "</div>";

    var v = document.getElementById("player");

    if (!v) return;

    var all = readJSON(KEYS.progress, {});
    var srcs = v.querySelectorAll("source");

    if (srcs.length) {
      srcs[srcs.length - 1].addEventListener("error", function () {
        document.getElementById("playerWrap").innerHTML = videoSlot(m.title);
      });
    }

    v.addEventListener("error", function () {
      document.getElementById("playerWrap").innerHTML = videoSlot(m.title);
    });

    v.addEventListener("loadedmetadata", function () {
      var p = all[m.id];

      if (p && p.time > 0 && p.percent < 95) {
        v.currentTime = p.time;
      }
    });

    v.addEventListener("timeupdate", function () {
      all[m.id] = {
        time: v.currentTime,
        duration: v.duration || 0,
        percent: v.duration
          ? Math.floor((v.currentTime / v.duration) * 100)
          : 0
      };

      writeJSON(KEYS.progress, all);
    });
  }

  /* ---------- My List ---------- */

  function renderMyList() {
    var ids = getList();

    var saved = CATALOGUE.filter(function (t) {
      return ids.indexOf(t.id) !== -1;
    });

    document.getElementById("page-root").innerHTML = saved.length
      ? grid(saved)
      : emptyState(
          "Your list is waiting",
          ICON.plusBig + "Add movies and series from Browse to keep them here.",
          '<a class="' + btn("primary", "md") + '" href="browse.html">Explore titles</a>'
        );

    refreshListButtons();
  }

  /* ---------- Profile ---------- */

  function renderProfile() {
    var root = document.getElementById("page-root");
    var user = getUser();

    if (!user) {
      root.innerHTML = emptyState(
        "No profile yet",
        "Create a simple profile in this browser.",
        '<a class="' + btn("primary", "md") + '" href="signin.html">Continue</a>'
      );
      return;
    }

    var count = getList().length;

    root.innerHTML =
      '<div class="grid gap-5 md:grid-cols-12">' +

        '<div class="stat-box text-center md:col-span-4">' +

          '<div class="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-blush text-3xl font-extrabold text-primary">' +
            esc(user.name.slice(0, 1).toUpperCase()) +
          "</div>" +

          '<h2 class="text-xl font-bold">' +
            esc(user.name) +
          "</h2>" +

          '<p class="text-sm text-muted-foreground">' +
            esc(user.email) +
          "</p>" +

          '<p class="mt-3 text-sm">' +
            '<span class="font-bold">' + count + "</span> title" +
            (count === 1 ? "" : "s") +
            " in My List" +
          "</p>" +

        "</div>" +

        '<div class="stat-box md:col-span-8">' +

          '<h2 class="text-xl font-bold">Profile settings</h2>' +

          '<p class="mt-1 text-sm text-muted-foreground">' +
            "This profile is saved only in this browser." +
          "</p>" +

          '<div class="mt-5 flex flex-wrap gap-3">' +

            '<a class="' + btn("brandOutline", "md") +
            '" href="my-list.html">View My List</a>' +

            '<button type="button" id="signOut" class="' +
            btn("outline", "md") +
            '">Remove profile</button>' +

          "</div>" +

        "</div>" +

      "</div>";

    document.getElementById("signOut").addEventListener("click", function () {
      writeJSON(KEYS.user, null);
      location.reload();
    });
  }

  /* ---------- forms ---------- */

  function setError(input, msg) {
    var field = input.closest(".flex.flex-col.gap-1\\.5") || input.parentElement;
    var p = field.querySelector('[role="alert"]');

    if (msg) {
      if (!p) {
        p = document.createElement("p");
        p.setAttribute("role", "alert");
        p.className = "text-xs font-semibold text-destructive";
        field.appendChild(p);
      }

      p.textContent = msg;
      input.setAttribute("aria-invalid", "true");
    } else {
      if (p) p.remove();
      input.setAttribute("aria-invalid", "false");
    }

    return !msg;
  }

  function setupSignin() {
    var form = document.querySelector("main form");
    var name = document.getElementById("signinName");
    var email = document.getElementById("signinEmail");

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var ok = setError(
        name,
        name.value.trim() ? "" : "Enter your name."
      );

      ok = setError(
        email,
        isEmail(email.value) ? "" : "Enter a valid email address."
      ) && ok;

      if (!ok) return;

      writeJSON(KEYS.user, {
        name: name.value.trim(),
        email: email.value.trim()
      });

      toast("Local profile saved in this browser.");

      setTimeout(function () {
        location.href = "profile.html";
      }, 600);
    });
  }

  function setupContact() {
    var form = document.querySelector("main form");

    var f = {
      name: document.getElementById("name"),
      email: document.getElementById("email"),
      topic: document.getElementById("topic"),
      message: document.getElementById("message")
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var old = form.querySelector('[role="status"]');
      if (old) old.remove();

      var ok = setError(
        f.name,
        f.name.value.trim() ? "" : "Enter your name."
      );

      ok = setError(
        f.email,
        isEmail(f.email.value) ? "" : "Enter a valid email."
      ) && ok;

      ok = setError(
        f.topic,
        f.topic.value ? "" : "Choose a topic."
      ) && ok;

      ok = setError(
        f.message,
        f.message.value.trim().length >= 10
          ? ""
          : "Write at least 10 characters."
      ) && ok;

      if (!ok) return;

      form.reset();

      var p = document.createElement("p");
      p.setAttribute("role", "status");
      p.className = "rounded-lg border-l-4 border-primary bg-blush p-4 text-sm";
      p.textContent = "Your message passed the form checks. Message sending is not connected yet.";

      form.appendChild(p);
    });
  }

  function setupSubscribe() {
    document.querySelectorAll('main form input[type="email"]').forEach(function (input) {
      var form = input.closest("form");

      if (page === "contact" || page === "signin") return;

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        var msg = form.parentElement.querySelector('[role="status"]');

        if (!msg) {
          msg = document.createElement("p");
          msg.setAttribute("role", "status");
          msg.className = "mt-3 text-sm font-semibold text-blush-foreground";
          form.after(msg);
        }

        msg.textContent = "Thank you for your interest in WATCHON!";
        form.reset();
      });
    });
  }

  function setupPlans() {
    document.querySelectorAll("main button").forEach(function (b) {
      var m = b.textContent.trim().match(/^Choose (\w+)/);

      if (m) {
        b.addEventListener("click", function () {
          toast(m[1] + " is a planned option. Payment processing is not connected yet.");
        });
      }
    });
  }

  /* ---------- accordions ---------- */

  function setupAccordions() {
    var triggers = document.querySelectorAll("button[aria-controls]");

    triggers.forEach(function (t) {
      t.addEventListener("click", function () {
        var open = t.getAttribute("data-state") !== "open";

        var group = t.closest("[data-orientation]") &&
          t.closest("[data-orientation]").parentElement;

        triggers.forEach(function (o) {
          if (
            o !== t &&
            group &&
            group.contains(o) &&
            o.getAttribute("data-state") === "open"
          ) {
            toggleItem(o, false);
          }
        });

        toggleItem(t, open);
      });
    });
  }

  function toggleItem(t, open) {
    var state = open ? "open" : "closed";

    t.setAttribute("data-state", state);
    t.setAttribute("aria-expanded", open ? "true" : "false");

    var c = document.getElementById(t.getAttribute("aria-controls"));

    if (c) {
      c.hidden = !open;
      c.setAttribute("data-state", state);
    }

    var item = t.closest("[data-orientation][data-state]");

    if (item && item !== t) {
      item.setAttribute("data-state", state);
    }

    var h3 = t.closest("h3");

    if (h3) {
      h3.setAttribute("data-state", state);
    }
  }

  function setupHelp() {
    var form = document.querySelector('main form[role="search"]');
    var input = form.querySelector("input");
    var faq = document.getElementById("helpFaq");
    var items = faq.querySelectorAll("[data-orientation][data-state]");
    var acc = items.length ? items[0].parentElement : null;

    var empty = document.createElement("p");
    empty.className = "rounded-2xl border-2 border-dashed p-8 text-center text-muted-foreground";
    empty.textContent = "No matching questions found. Try another search.";
    empty.hidden = true;

    if (acc) acc.after(empty);

    var count = document.createElement("p");
    count.setAttribute("aria-live", "polite");
    count.className = "mt-3 text-sm text-muted-foreground";
    count.hidden = true;

    form.after(count);

    function apply(term) {
      term = term.toLowerCase().trim();

      var n = 0;

      items.forEach(function (it) {
        var match = !term || it.textContent.toLowerCase().indexOf(term) !== -1;
        it.hidden = !match;

        if (match) n++;
      });

      if (acc) acc.hidden = n === 0;

      empty.hidden = n !== 0;
      count.hidden = !term;
      count.textContent = n + " matching question(s) found.";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      apply(input.value);
      faq.scrollIntoView({ behavior: "smooth" });
    });

    input.addEventListener("input", function () {
      if (!input.value.trim()) apply("");
    });
  }

  function setupPrivacy() {
    document.querySelectorAll("main button").forEach(function (b) {
      if (/print|download/i.test(b.textContent)) {
        b.addEventListener("click", function () {
          window.print();
        });
      }
    });

    var top = document.createElement("button");
    top.type = "button";
    top.setAttribute("aria-label", "Back to top");
    top.hidden = true;

    top.className = btn("primary", "md")
      .replace("h-9 px-4 py-2", "h-9 w-9") +
      " no-print fixed bottom-6 right-6 z-40 rounded-full shadow-lift";

    top.innerHTML = ICON.up;

    top.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.body.appendChild(top);

    window.addEventListener("scroll", function () {
      top.hidden = window.scrollY <= 300;
    }, { passive: true });
  }

  /* ---------- Cookies ---------- */

  function setupCookies() {
    var keys = ["functional", "analytics", "marketing"];
    var saved = readJSON(KEYS.cookies, null) || {};

    var prefs = {
      essential: true,
      functional: saved.functional === true,
      analytics: saved.analytics === true,
      marketing: saved.marketing === true
    };

    var section = document.getElementById("preferences");

    function paint() {
      keys.forEach(function (k) {
        var sw = document.getElementById("cookie-" + k);

        if (!sw) return;

        var st = prefs[k] ? "checked" : "unchecked";

        sw.setAttribute("aria-checked", prefs[k] ? "true" : "false");
        sw.setAttribute("data-state", st);

        var thumb = sw.querySelector("span");

        if (thumb) {
          thumb.setAttribute("data-state", st);
        }
      });
    }

    function status(show) {
      var p = section.querySelector('[role="status"]');

      if (!show) {
        if (p) p.remove();
        return;
      }

      if (!p) {
        p = document.createElement("p");
        p.setAttribute("role", "status");
        p.className = "mt-4 text-sm font-semibold text-success";
        section.appendChild(p);
      }

      p.textContent = "Your cookie preferences have been saved.";
    }

    function save(next) {
      prefs = next;
      writeJSON(KEYS.cookies, prefs);
      paint();
      status(true);
    }

    keys.forEach(function (k) {
      var sw = document.getElementById("cookie-" + k);

      if (sw) {
        sw.addEventListener("click", function () {
          prefs[k] = !prefs[k];
          paint();
          status(false);
        });
      }
    });

    section.querySelectorAll("button:not([role=switch])").forEach(function (b) {
      var label = b.textContent.trim();

      b.addEventListener("click", function () {
        if (label === "Accept All") {
          save({
            essential: true,
            functional: true,
            analytics: true,
            marketing: true
          });
        } else if (label === "Reject Optional") {
          save({
            essential: true,
            functional: false,
            analytics: false,
            marketing: false
          });
        } else if (label === "Save Preferences") {
          save(prefs);
        }
      });
    });

    paint();
  }

  /* ---------- catalogue loading ---------- */

  function statusBox() {
    var box = document.getElementById("catalogue-status");

    if (!box) {
      box = document.createElement("div");
      box.id = "catalogue-status";
      box.setAttribute("role", "status");
      box.setAttribute("aria-live", "polite");

      var main = document.querySelector("main");

      if (main) {
        main.insertBefore(box, main.firstChild);
      }
    }

    return box;
  }

  function showStatus(text, kind) {
    var box = statusBox();

    box.className = "container mx-auto px-4 pt-4";

    box.innerHTML =
      '<p class="rounded-lg border-l-4 border-primary bg-blush p-3 text-sm">' +
      esc(text) +
      "</p>";

    box.setAttribute("data-kind", kind || "info");
  }

  function hideStatus() {
    var box = document.getElementById("catalogue-status");

    if (box) box.remove();
  }

  function showLoadError() {
    var box = statusBox();

    box.className = "container mx-auto px-4 pt-4";

    box.innerHTML =
      '<div class="rounded-lg border-l-4 border-primary bg-blush p-4 text-sm">' +
      "<strong>We could not load the catalogue.</strong> " +
      "Please check your connection and try again. " +
      '<button type="button" id="retryCatalogue" class="ml-2 font-bold text-primary underline">Try again</button>' +
      "</div>";

    document.getElementById("retryCatalogue").addEventListener("click", function () {
      location.reload();
    });
  }

  function loadCatalogue() {
    return Promise.resolve()
      .then(function () {
        return fetch(CATALOGUE_URL);
      })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("HTTP " + res.status);
        }

        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data) || !data.length) {
          throw new Error("Catalogue file is empty or invalid");
        }

        return {
          data: data,
          fromFallback: false
        };
      })
      .catch(function (err) {
        var local = window.WATCHON_CATALOGUE;

        if (Array.isArray(local) && local.length) {
          return {
            data: local,
            fromFallback: true,
            error: err
          };
        }

        throw err;
      });
  }

  /* ---------- OMDb titles ---------- */

  var OMDB_TITLES = [
    ["Guardians of the Galaxy: Vol. 2", "2017"],
    ["Spider-Man: Into the Spider-Verse", "2018"],
    ["Coco", "2017"],
    ["Moana", "2016"],
    ["Finding Nemo", "2003"],
    ["The Incredibles", "2004"],
    ["Jurassic Park", "1993"],
    ["Back to the Future", "1985"],
    ["Jumanji: Welcome to the Jungle", "2017"],
    ["Paddington 2", "2017"],
    ["How to Train Your Dragon", "2010"],
    ["The Lego Movie", "2014"],
    ["Big Hero 6", "2014"],
    ["Zootopia", "2016"],
    ["Harry Potter and the Sorcerer's Stone", "2001"],
    ["Avengers: Endgame", "2019"],
    ["Black Panther", "2018"],
    ["The Martian", "2015"],
    ["The Karate Kid", "2010"],
    ["Night at the Museum", "2006"]
  ];

  function loadOmdbTitles() {
    var key = String(window.OMDB_API_KEY || "").trim();

    if (!key || key === "PASTE_YOUR_OMDB_API_KEY_HERE") {
      return Promise.resolve([]);
    }

    var cacheKey = "watchonOmdbTitlesV1";
    var cache = readJSON(cacheKey, null);
    var now = Date.now();

    if (
      cache &&
      cache.savedAt &&
      now - cache.savedAt < 7 * 24 * 60 * 60 * 1000 &&
      Array.isArray(cache.titles) &&
      cache.titles.length
    ) {
      return Promise.resolve(cache.titles);
    }

    return Promise.all(OMDB_TITLES.map(function (item) {
      var url =
        "https://www.omdbapi.com/?apikey=" +
        encodeURIComponent(key) +
        "&t=" + encodeURIComponent(item[0]) +
        "&y=" + encodeURIComponent(item[1]) +
        "&type=movie";

      return fetch(url)
        .then(function (response) {
          if (!response.ok) {
            throw new Error("OMDb request failed");
          }

          return response.json();
        })
        .then(function (movie) {
          if (!movie || movie.Response !== "True" || !movie.imdbID) {
            return null;
          }

          var year = parseInt(String(movie.Year || "").slice(0, 4), 10);

          return {
            id: "omdb-" + movie.imdbID,
            title: movie.Title || item[0],
            type: "Movie",
            genre: movie.Genre || "Movie",
            year: isNaN(year) ? item[1] : year,
            duration: movie.Runtime && movie.Runtime !== "N/A"
              ? movie.Runtime
              : "Feature film",
            rating: movie.Rated && movie.Rated !== "N/A"
              ? movie.Rated
              : "Not rated",
            description: movie.Plot && movie.Plot !== "N/A"
              ? movie.Plot
              : "Movie information supplied by OMDb.",
            poster: movie.Poster && movie.Poster !== "N/A"
              ? movie.Poster
              : "",
            video: "",
            imdbID: movie.imdbID,
            source: "OMDb"
          };
        })
        .catch(function () {
          return null;
        });
    })).then(function (titles) {
      var valid = titles.filter(Boolean);

      writeJSON(cacheKey, {
        savedAt: Date.now(),
        titles: valid
      });

      return valid;
    });
  }

  /* ---------- start ---------- */

  function start() {
    if (page === "browse") setupBrowse();
    if (page === "details") renderDetails();
    if (page === "watch") renderWatch();
    if (page === "my-list") renderMyList();

    refreshListButtons();
  }

  /* ---------- initialise ---------- */

  setupHeader();

  if (page === "profile") renderProfile();
  if (page === "signin") setupSignin();
  if (page === "contact") setupContact();
  if (page === "plans") setupPlans();

  if (page === "help") {
    setupAccordions();
    setupHelp();
  }

  if (page === "privacy") {
    setupAccordions();
    setupPrivacy();
  }

  if (page === "cookies") {
    setupCookies();
  }

  setupSubscribe();
  refreshListButtons();

  var needsCatalogue = !!NEEDS_CATALOGUE[page];

  if (needsCatalogue) {
    showStatus("Loading catalogue...", "loading");
  }

  loadCatalogue()
    .then(function (result) {
      return loadOmdbTitles().then(function (extraTitles) {
        CATALOGUE = result.data.concat(
          extraTitles.filter(function (extra) {
            return !result.data.some(function (original) {
              return String(original.title).toLowerCase() ===
                String(extra.title).toLowerCase();
            });
          })
        );

        if (needsCatalogue) {
          hideStatus();
        }

        start();
      });
    })
    .catch(function () {
      if (needsCatalogue) {
        showLoadError();
      }
    });

})();