// 10 PROPOZYCJI TEMATYCZNYCH /////////////////////////////////////////////////////////////////////////////////
// Each theme mirrors the original page's text budget:
//   brand  ~10 chars   (O POSITIVE)
//   title  ~9 chars    (DIRECTORS)
//   nav    5 items     (Directors, Creative, About, Press, Contact)
//   roster 12 names    (11–16 chars each)
//   description ~140 chars
// `accent` replaces the original #F93434, `seed` feeds the placeholder images (swap `img` for real files).

const themes = [
    {
        id: "halo",
        brand: "HALO STUDIO",
        title: "Shooters",
        accent: "#FF4D2E",
        seed: "halo",
        nav: ["Shooters", "Stills", "Studio", "Journal", "Contact"],
        description: "Meet the photographers of Halo Studio. Explore editorial and campaign work from image makers shaping fashion, light and portraiture.",
        roster: ["Ava Lindqvist", "Noah Brennan", "Ines Marchetti", "Theo Halvorsen", "Lena Fischer", "Oskar Wilhelmsen", "Clara Montague", "Jonas Pike", "Marco Ferrante", "Ruby Ashworth", "Felix Dragomir", "Yara Castellano"]
    },
    {
        id: "monolith",
        brand: "MONOLITH",
        title: "Architects",
        accent: "#D4FF3A",
        seed: "monolith",
        nav: ["Architects", "Projects", "Practice", "Awards", "Contact"],
        description: "Meet the architects of Monolith. Explore houses, towers and public spaces from a practice shaping concrete, timber and quiet cities.",
        roster: ["Erik Sandvik", "Hana Okamura", "Pablo Ibarrola", "Sofie Kristen", "Liam Dorsey", "Valentina Orsini", "Matteo Galbiati", "Ida Lorentz", "Tomasz Wierzba", "Nadia Haddad", "Kasper Vedel", "Rhea Lindholm"]
    },
    {
        id: "lowtide",
        brand: "LOW TIDE",
        title: "Producers",
        // night-blue photo set → warm accent for contrast on hover; P key / switcher cycles the palettes
        accent: "#FF9A3C",
        bg: "#0B0E14",
        panel: "#1A1F2B",
        palettes: [
            { name: "Sodium", accent: "#FF9A3C", bg: "#0B0E14", panel: "#1A1F2B" },
            { name: "Ice", accent: "#9FE3FF", bg: "#080B12", panel: "#161C28" },
            { name: "Coral", accent: "#FF5E5B", bg: "#0D0F16", panel: "#1C1F2A" },
            { name: "Acid", accent: "#D6FF4A", bg: "#0A0C10", panel: "#1A1D24" }
        ],
        seed: "lowtide",
        // Unsplash (free Unsplash License), curated for one cinematic blue-hour grade
        images: [
            "photo-1580935727530-99e8732bc21e",
            "photo-1621623207386-54450400f7cb",
            "photo-1608459410902-3d4661574e7a",
            "photo-1730304539413-02706e6705db",
            "photo-1569315888779-22ceb4303f35",
            "photo-1673131891738-3c38bb62b89c",
            "photo-1600119692901-94e8b7d2eacd",
            "photo-1648801750597-fb1e25967af3",
            "photo-1543868519-fc5437bc63fe",
            "photo-1730875646247-86a25efbdcba",
            "photo-1502056618377-f15b18d813b7",
            "photo-1547133133-8544d10b9ae6"
        ],
        nav: ["Producers", "Releases", "Label", "News", "Contact"],
        description: "Meet the producers of Low Tide Records. Explore albums, remixes and scores from studio minds shaping club culture and modern soul.",
        roster: ["Kai Morrison", "Dina Volkova", "Elliot Stroud", "Mara Quinlan", "Joe Rafferty", "Benedikt Lorenz", "Simone Akintola", "Remy Vance", "Juno Takahashi", "Otis Fairbank", "Lucia Bergström", "Sami Harrington"]
    },
    {
        id: "saltember",
        brand: "SALT EMBER",
        title: "Kitchens",
        accent: "#FF7A1A",
        seed: "ember",
        nav: ["Kitchens", "Menus", "Story", "Events", "Booking"],
        description: "Meet the kitchens of Salt Ember. Explore fire-led restaurants from chefs shaping seasonal cooking, open flames and long shared tables.",
        roster: ["Brasa Norte", "Ember Room", "Casa Fumo", "Salt Cellar", "Oak & Ash", "Little Charcoal", "Mercado Brasa", "Hearth No.9", "Smoke Garden", "Fire Island", "Tavern Cinder", "Ember Counter"]
    },
    {
        id: "blackpoint",
        brand: "BLACK POINT",
        title: "Photographers",
        accent: "#E8DCC4",
        // bronze title (picked in Figma): white names on it 3.58:1, it on the background 5.23:1 —
        // the same relationship as the original red, so no extra contrast treatment is needed.
        titleColor: "#99855D",
        seed: "anchor",
        grayscale: true,
        nav: ["Our team", "Projects", "Studio", "Contact"],
        // where the menu links go on this site (empty = stay on the listing)
        navLinks: ["team.html", "projects.html", "studio.html", "contact.html"],
        // body type from the Figma file; display type stays Anybody
        fontBody: '"Instrument Sans", "General Sans", "Helvetica Neue", Arial, sans-serif',
        // all photos live in the project (img/team, img/work; authors in img/CREDITS.md)
        localPhotos: true,
        // the picture of each photographer's own project, where it differs from img/team
        photos: {
            "Rex Calloway": "img/rex-calloway-low-season.jpg",
            "Nina Sorrento": "img/work/ash-delgado-0.jpg",
            "Dex Margolin": "img/work/rex-calloway-4.jpg",
            "Vera Kowalska": "img/work/vera-kowalska-1.jpg",
            "Ash Delgado": "img/team/bartholomew-kane.jpg",
            "Bartholomew Kane": "img/work/ash-delgado-6.jpg",
            "Lola Vandermeer": "img/work/zane-holloway-1.jpg",
            "Mila Petrović": "img/work/mila-petrovic-1.jpg",
            "Greta Lindmark": "img/team/nina-sorrento.jpg"
        },
        // upright pictures: where the subject sits when the frame crops them
        photoPos: {
            "img/work/mila-petrovic-1.jpg": "50% 45%"
        },
        // a picture that now belongs to someone else's project is replaced in the gallery it came from
        galleryLoans: {
            "rex-calloway-4": "img/team/dex-margolin.jpg",
            "greta-lindmark-6": "img/team/greta-lindmark.jpg",
            "ash-delgado-6": "img/team/ash-delgado.jpg",
            "vera-kowalska-1": "img/team/vera-kowalska.jpg",
            "zane-holloway-1": "img/team/lola-vandermeer.jpg"
        },
        description: "Meet the photographers of Black Point. Explore portraits, campaigns and quiet documentary work from image makers shaping light in mono.",
        roster: ["Rex Calloway", "Nina Sorrento", "Dex Margolin", "Vera Kowalska", "Ash Delgado", "Bartholomew Kane", "Lola Vandermeer", "Ivo Ruskin", "Mila Petrović", "Zane Holloway", "Greta Lindmark", "Cyrus Abernathy"],
        // PROFILE PAGES (click a name). One entry per roster name, same order. Clients are fictional.
        profile: {
            role: "Photographer",
            back: "Home",
            backHref: "home.html",
            next: "Next photographer",
            work: "Selected work",
            people: [
                { city: "Lisbon", focus: ["Portrait", "Editorial"], clients: ["Mono Journal", "Atelier Vey", "North Wool"], bio: "Rex photographs people the way they stand when nobody is directing them. Long lenses, short sessions and a habit of shooting the moment after the pose." },
                { city: "Milan", focus: ["Fashion", "Campaign"], clients: ["Casa Orsi", "Lumen Press", "Halden"], bio: "Nina builds pictures out of shadow first and light second. Her campaigns feel like stills from films that were never made." },
                { city: "New York", focus: ["Documentary", "Music"], clients: ["Kaze Records", "Salt Magazine", "Fable & Co"], bio: "Dex spent a decade on tour buses and backstage corridors. He still works like a reporter: one body, two primes, no assistants." },
                { city: "Warsaw", focus: ["Portrait", "Still life"], clients: ["Oro Studio", "Mono Journal", "Brzask"], bio: "Vera treats a face like an object and an object like a face. Patient, symmetrical frames lit with a single window and a lot of waiting." },
                { city: "Mexico City", focus: ["Street", "Editorial"], clients: ["Atlas Weekly", "Ciudad Norte", "Kinbo"], bio: "Ash walks fifteen kilometres a day with a compact camera. The city does the styling, the light does the casting." },
                { city: "London", focus: ["Campaign", "Automotive"], clients: ["Vantage Motors", "Halden", "Grey Atlas"], bio: "Bartholomew shoots machines with the tenderness usually saved for portraits. Precise, cold and quietly romantic." },
                { city: "Antwerp", focus: ["Fashion", "Beauty"], clients: ["Maison Lier", "Lumen Press", "Ode"], bio: "Lola's studio is a white box and a black cloth. Everything else is gesture, skin and the edge of a sleeve." },
                { city: "Oslo", focus: ["Landscape", "Architecture"], clients: ["Nordhaus", "Fjell & Co", "Mono Journal"], bio: "Ivo waits for weather the way others wait for talent. His buildings and coastlines are photographed in the last ten minutes of light." },
                { city: "Belgrade", focus: ["Documentary", "Portrait"], clients: ["Atlas Weekly", "Salt Magazine", "Reka"], bio: "Mila follows small communities for years before publishing a single frame. Her portraits carry the trust that takes." },
                { city: "Los Angeles", focus: ["Music", "Campaign"], clients: ["Kaze Records", "Palm Static", "Halden"], bio: "Zane shoots album covers, tour posters and the odd perfume film. Hard flash, deep blacks and zero retouching on skin." },
                { city: "Copenhagen", focus: ["Interiors", "Still life"], clients: ["Nordhaus", "Ode", "Atelier Vey"], bio: "Greta photographs rooms as if someone just left them. Furniture brands hire her for calm, magazines hire her for mood." },
                { city: "Marseille", focus: ["Editorial", "Travel"], clients: ["Salt Magazine", "Ciudad Norte", "Fable & Co"], bio: "Cyrus works between the Mediterranean and the Atlantic, on film whenever the budget allows. Sun, salt and a lot of grain." }
            ],
            // one project per photographer, same order as the roster: the one source for Home, the profiles and Projects
            projects: [
                { title: "Low Season", client: "Mono Journal", year: 2025, line: "A mountain resort in February. Nobody on the slopes, everybody at the window." },
                { title: "Night Ferry", client: "Casa Orsi", year: 2024, line: "A campaign shot between two crossings, with what was left of the evening." },
                { title: "White Noise", client: "Fable & Co", year: 2025, line: "A band off the road: empty cafés and slow mornings, shot with the same two primes as the tour." },
                { title: "Interior No.4", client: "Oro Studio", year: 2025, line: "A desk photographed like a face, in the same window light, for a whole winter." },
                { title: "On Foot", client: "Ciudad Norte", year: 2023, line: "One city, on foot, every day for a season. Rooftops, crossings and nobody posing." },
                { title: "Long Haul", client: "Vantage Motors", year: 2026, line: "A transport campaign shot from one bridge: rails, tankers and the last light on the steel." },
                { title: "First Light", client: "Maison Lier", year: 2026, line: "A beauty story shot outdoors for once: low sun, loose hair and no white box in sight." },
                { title: "Quiet Index", client: "Fjell & Co", year: 2023, line: "The same fifteen kilometres for a year. The land did the styling, the weather did the casting." },
                { title: "Common Ground", client: "Reka", year: 2022, line: "Three years in one small community before a single frame was published." },
                { title: "Second Skin", client: "Palm Static", year: 2024, line: "A perfume film without the perfume: water, hair and zero retouching." },
                { title: "After Hours", client: "Nordhaus", year: 2023, line: "A library once the doors close: steel, glass and the last light on the shelves." },
                { title: "High Ground", client: "Ciudad Norte", year: 2025, line: "Two weeks around one volcano, on film whenever the budget allowed. Sun, ash and a lot of grain." }
            ]
        }
    },
    {
        id: "vanta",
        brand: "VANTA",
        title: "Faces",
        accent: "#FF4FA3",
        seed: "vanta",
        nav: ["Faces", "Women", "Men", "Agency", "Contact"],
        description: "Meet the faces of Vanta Models. Explore runway, beauty and campaign portfolios from new talent shaping the look of fashion right now.",
        roster: ["Amara Okafor", "Lucas Mercier", "Freya Holmberg", "Dante Romano", "Saskia Veld", "Anouk Vermeulen", "Elodie Fontaine", "Kenji Arata", "Bianca Leclerc", "Iris Novotná", "Malik Desrosiers", "Signe Rasmussen"]
    },
    {
        id: "pixelforge",
        brand: "PIXEL FORGE",
        title: "Animators",
        accent: "#7B5CFF",
        seed: "forge",
        nav: ["Animators", "Motion", "Studio", "Lab", "Contact"],
        description: "Meet the animators of Pixel Forge. Explore 3D, 2D and motion design from artists shaping title sequences, games and brand worlds.",
        roster: ["Leo Fitzgerald", "Mina Sato", "Arturo Benítez", "Paula Strand", "Owen Becker", "Ottilie Marchand", "Kiran Bhatt", "Nils Ekdahl", "Rosa Villaverde", "Hugo Lambert", "Tilda Rosenqvist", "Emil Kaczmarek"]
    },
    {
        id: "roastritual",
        brand: "ROAST RITUAL",
        title: "Origins",
        accent: "#D79A4E",
        seed: "roast",
        nav: ["Origins", "Roastery", "Brewing", "Wholesale", "Contact"],
        description: "Meet the origins of Roast Ritual. Explore single estate coffees from farmers shaping flavour at altitude, roasted slowly in small batches.",
        roster: ["Ethiopia Guji", "Kenya Nyeri AA", "Colombia Huila", "Brazil Cerrado", "Rwanda Huye", "Guatemala Antigua", "Tanzania Mbeya", "Peru Cajamarca", "Burundi Kayanza", "Yemen Haraz", "Panama Boquete", "Honduras Marcala"]
    },
    {
        id: "apexgarage",
        brand: "APEX GARAGE",
        title: "Drivers",
        accent: "#FFD400",
        seed: "apex",
        nav: ["Drivers", "Machines", "Team", "Calendar", "Contact"],
        description: "Meet the drivers of Apex Garage. Explore endurance, rally and circuit seasons from racers shaping speed, grip and late braking points.",
        roster: ["Max Hollander", "Rui Fontes", "Kimi Lahtinen", "Jack Ostrowski", "Toni Ricci", "Alessandro Vitti", "Sebastian Krüger", "Niko Valli", "Lars Engström", "Mateo Saldana", "Charlie Whitcombe", "Elena Barrichi"]
    },
    {
        id: "loudmouth",
        brand: "LOUD MOUTH",
        title: "Comedians",
        accent: "#FF2E63",
        seed: "loud",
        nav: ["Comedians", "Shows", "Club", "Podcast", "Tickets"],
        description: "Meet the comedians of Loud Mouth Club. Explore specials and late shows from stand-up comics shaping sharp jokes and awkward silences.",
        roster: ["Benny Marlowe", "Tess Harrigan", "Gus Pemberton", "Holly Dunmore", "Abe Kowalski", "Priscilla Duarte", "Reggie Ballard", "Nell Sparks", "Murray Quint", "Dora Feldman", "Wendell Okonkwo", "Fiona McCready"]
    }
]

const slug = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

// Everything one profile page needs, derived from the theme (deterministic per name)
const UPRIGHT = new Set(["img/work/mila-petrovic-1.jpg"])
function profileFor(theme, index) {
    const p = theme.profile, person = p.people[index], name = theme.roster[index]
    // the first frame is the photographer's project, the rest are other jobs for their clients
    const project = p.projects[index]
    const work = Array.from({ length: 7 }, (_, k) => k === 0
        ? { title: project.title, client: project.client, year: project.year, landscape: !UPRIGHT.has(imageFor(theme, name)), img: 0 }
        : { client: person.clients[k % person.clients.length], year: 2026 - ((index + k) % 5), landscape: (index + k) % 3 === 1, img: k })
    return { name, index, ...person, role: p.role, work }
}

function galleryImage(theme, name, k, w, h) {
    if (theme.localPhotos) {
        const cover = imageFor(theme, name), key = `${slug(name)}-${k}`
        if (k === 0) return cover // the project opens the gallery
        const src = (theme.galleryLoans && theme.galleryLoans[key]) || `img/work/${key}.jpg`
        return src === cover ? `img/work/${slug(name)}-0.jpg` : src // no picture twice
    }
    const g = theme.grayscale ? "?grayscale" : ""
    return `https://picsum.photos/seed/${theme.seed}-${slug(name)}-w${k}/${w}/${h}${g}`
}

// Curated Unsplash photos when a theme lists `images` (one per roster name, same order);
// otherwise seeded picsum placeholders so every name always gets the same picture.
function imageFor(theme, name, w = 1920, h = 1080) {
    const i = theme.roster.indexOf(name)
    if (theme.photos && theme.photos[name]) return theme.photos[name]
    if (theme.localPhotos) return `img/team/${slug(name)}.jpg`
    if (theme.images && theme.images[i]) {
        const q = w < 200 ? 30 : 80
        return `https://images.unsplash.com/${theme.images[i]}?auto=format&fit=crop&w=${w}&h=${h}&q=${q}`
    }
    const g = theme.grayscale ? "?grayscale" : ""
    return `https://picsum.photos/seed/${theme.seed}-${slug(name)}/${w}/${h}${g}`
}

// inline style for a picture that needs its own crop
const photoPos = (theme, src) => (theme.photoPos && theme.photoPos[src] ? ` style="object-position:${theme.photoPos[src]}"` : "")
