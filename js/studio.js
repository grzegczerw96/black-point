// BLACK POINT — STUDIO. The shared chrome and sections live in site.js; this file is the page itself, in order:
// the word you walk through, how we work, the manifesto, the five rules and the clients as closing credits.
// Scroll is the only thing the visitor has to do. The layouts for each window shape follow test 2 (5.11.2026);
// everything that depends on the window is measured in fit() and init(), so a rebuild after a window change gets it right.

// CONTENT /////////////////////////////////////////////////////////////////////////////////////////////////
const work = (who, k) => `img/work/${who}-${k}.jpg`
const OPENING_IMG = work("lola-vandermeer", 1)
const STEPS = [
	{ word: "Brief", text: "We read the brief together and answer with references, not a deck. One meeting, one page.", img: work("vera-kowalska", 1) },
	{ word: "Casting", text: "The story picks the photographer. Every brief is cast in one meeting, the whole table votes.", img: work("nina-sorrento", 2) },
	{ word: "Shoot", text: "Three people on set instead of thirty. Quieter sets get truer pictures, and smaller budgets go further.", img: work("dex-margolin", 0) },
	{ word: "Edit & Print", text: "Hand retouching, a paper proof, a printed archive for you. What was there stays.", img: work("nina-sorrento", 1) }
]
const SENTENCE = "We believe a photograph is earned, not taken. We wait for the light, we listen before we shoot and we leave things out."
const VALUES = [
	{ word: "Patience", text: "We wait for the moment instead of manufacturing it.", img: work("vera-kowalska", 2) },
	{ word: "Honesty", text: "No smoothed skin, no swapped skies. What was there stays.", img: work("zane-holloway", 1) },
	{ word: "Craft", text: "Light, print and paper: we care about the whole chain.", img: work("ivo-ruskin", 0) },
	{ word: "Restraint", text: "A frame is finished when nothing is left to remove.", img: work("nina-sorrento", 1) },
	{ word: "Trust", text: "Twelve photographers, one table. Every edit is reviewed together.", img: work("greta-lindmark", 0) }
]
// Where a picture sits in its frame, when the middle is not right (user 26.11.2026: "the pictures should be centred"):
// the portraits stand in wide frames, so only a band of each shows. The road (Shoot): the road and the mountains, not
// the clouds alone. The rest stay in the middle. (Edit & Print and Restraint had the letters, an upright cut of a wide
// photograph; since 26.11.2026 nina-sorrento-1 is a wide photograph of prints on a white table, the user's choice C)
const FOCUS = { [work("dex-margolin", 0)]: "50% 85%" }
const focus = src => FOCUS[src] ? ` style="object-position: ${FOCUS[src]}"` : ""
const CONTACT_SHEET = theme.roster.flatMap(n => [0, 1, 2].map(k => galleryImage(theme, n, k)))
const KEPT = 17 // the one frame of the 36 that survives the edit
// every client named in the profiles, with who shot for them and when (years are illustrative)
const CLIENTS = []
theme.profile.people.forEach((p, i) => p.clients.forEach((name, k) => {
	let c = CLIENTS.find(x => x.name === name)
	if (!c) CLIENTS.push(c = { name, people: [], years: [] })
	c.people.push(theme.roster[i].split(" ")[0])
	c.years.push(2014 + ((i * 5 + k * 3) % 13))
}))
// the jobs on the profiles count too, so a project's year always falls inside its client's dates
theme.roster.forEach((n, i) => profileFor(theme, i).work.forEach(w => CLIENTS.find(c => c.name === w.client).years.push(w.year)))
CLIENTS.forEach(c => { c.from = Math.min(...c.years); c.to = Math.max(...c.years) })
CLIENTS.sort((a, b) => a.from - b.from || a.name.localeCompare(b.name))

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a, b, t) => a + (b - a) * t
const smooth = t => t * t * (3 - 2 * t)
// How the stepped scenes (How we work, Our values) follow the scroll, to compare (user 24.11.2026: "aggressive, it ends
// fast and abruptly"): ?snap=a | b | c in the address, remembered for the tab like ?scroll=. a is the way it was; b is the
// default since the user chose it (24.11.2026).
//   edge: where the change starts in a stop's length (0.28: the change takes the middle 44 %, the rest is the shelf)
//   lag: seconds the scene takes to catch up with the scroll, easing out (0: it follows the scroll exactly)
//   pull: the snap that finishes a change the scroll stopped in
const FEELS = {
	a: { edge: 0.28, lag: 0, pull: { delay: 0.4, duration: { min: 0.35, max: 0.8 }, ease: "power1.inOut" } },
	b: { edge: 0.28, lag: 0.9, pull: { delay: 0.4, duration: { min: 0.35, max: 0.8 }, ease: "power1.inOut" } },
	c: { edge: 0.15, lag: 0.7, pull: { delay: 0.15, duration: { min: 0.6, max: 1.2 }, ease: "power2.inOut" } }
}
const FEEL = FEELS[(() => {
	let v = new URLSearchParams(location.search).get("snap")
	try { if (v in FEELS) sessionStorage.setItem("bp-snap", v); else v = sessionStorage.getItem("bp-snap") } catch (e) {}
	return v in FEELS ? v : "b" // b chosen by the user 24.11.2026 (was a); a and c stay to compare
})()]
// Scroll progress to a scene's stops. Each stop is a shelf: it holds for most of the way and the change happens in the
// middle, so the scene is nearly always at rest on a stop
const shelves = (progress, units) => {
	const t = clamp(progress * (units + 0.4) - 0.2, 0, units), i = Math.min(units, Math.floor(t))
	return i + smooth(clamp((t - i - FEEL.edge) / (1 - 2 * FEEL.edge)))
}
// The gentle pull: only when the scroll has come to rest in the middle of a change, it finishes the change in the
// direction of travel. On a shelf nothing moves, and any new scroll cancels it, so it never works against the visitor
const settle = (units, feel = FEEL) => ({
	snapTo: (progress, st) => {
		const t = progress * (units + 0.4) - 0.2, i = Math.floor(t), f = t - i, e = feel.edge
		if (t <= 0 || t >= units || f <= e || f >= 1 - e) return progress
		return (i + (st.direction > 0 ? 1 - e + 0.01 : e - 0.01) + 0.2) / (units + 0.4)
	},
	...feel.pull, inertia: false
})
// The scene catches up with the scroll over FEEL.lag seconds, so a change slows down before it stops even when the
// scroll got there at once; a rebuild (now) puts it in place at once
// (an exponential follow on the ticker: a tween started anew on every scroll update never got to run)
const follower = (render, lag = FEEL.lag) => {
	if (!lag) return render
	let at = null, to = 0
	const tick = () => {
		// 95 % of the way in lag seconds; while a rebuilt page settles (dur() gives 0) it is in place at once
		at = dur(1) ? at + (to - at) * (1 - Math.exp(-3 * gsap.ticker.deltaRatio() / 60 / lag)) : to
		if (Math.abs(to - at) < 0.001) { at = to; gsap.ticker.remove(tick) }
		render(at)
	}
	return (t, now) => {
		to = t
		if (now || at === null) { at = t; gsap.ticker.remove(tick); return render(t) }
		gsap.ticker.add(tick)
	}
}
// The same catching up, as a spring (user 26.11.2026 on How we work: "too mechanical and fast; a slower start, then
// faster, then pulled in, without a long end"). The follow above starts at its fastest and ends slowest; a spring starts
// still, gathers speed and settles, and it keeps its speed when the scroll gives it a new target, so a change never
// starts again from a jerk. w: how stiff (5: one step takes about 0.9 s, 10 % at 0.1 s, 98 % at 0.85 s; was 10 % at 0.02,
// 98 % at 0.53), z: the damping (0.85: it settles sooner than at 1, the overshoot 0.4 % of a step, under a pixel)
const springer = (render, { w, z }) => {
	let at = null, v = 0, to = 0
	const tick = () => {
		if (!dur(1)) { at = to; v = 0 } // a rebuilt page: in place at once
		else for (let left = Math.min(0.05, gsap.ticker.deltaRatio() / 60); left > 0; left -= 1 / 240) {
			const dt = Math.min(left, 1 / 240)
			v += (w * w * (to - at) - 2 * z * w * v) * dt
			at += v * dt
		}
		if (Math.abs(to - at) < 0.0005 && Math.abs(v) < 0.005) { at = to; v = 0; gsap.ticker.remove(tick) }
		render(at)
	}
	return (t, now) => {
		to = t
		if (now || at === null) { at = t; v = 0; gsap.ticker.remove(tick); return render(t) }
		gsap.ticker.add(tick)
	}
}
// How we work, by the window's shape (test 2): low or very wide windows put the list beside the picture, tall and
// square ones put the picture across the measure, the rest the picture with its indent and the text beside it
// Computer windows all get the picture with its indent now (user 24.11.2026: the long, wide picture beside the list at
// 1920 × 950, 1536 × 730, 1366 × 650 was not liked); "side" is kept for phones held sideways, where the indent's picture
// would be a stamp. ?hw=side | indent | column in the address forces a layout, to compare
const hwMode = () => {
	const W = pageW(), H = window.innerHeight, ratio = W / H // the composition's shape (1920 at most)
	const asked = new URLSearchParams(location.search).get("hw")
	if (["side", "indent", "column"].includes(asked)) return asked
	// before 24.11.2026: return ratio >= 1.9 || (H < 700 && (W >= 600 || ratio >= 1.1)) ? "side" : ratio < 1.1 ? "column" : "indent"
	return H < 500 && ratio >= 1.1 ? "side" : ratio < 1.1 ? "column" : "indent"
}
// How we work, the change between steps, to compare (user 25.11.2026: two pictures at once for a moment, the clip's edge
// rides over a standing picture): ?anim=a | b | c | d in the address, remembered for the tab like ?snap=; ?anim=off goes
// back to the way it was (b with text 1 is the default since 25.11.2026). Sketches, for the indent and column layouts ("side" keeps its own; d
// only in indent):
//   a  one frame that stays: only the titles part, inside the frame the old picture fades into the new (1.05 → 1)
//   b  close, then open: the old window shuts in the first half of the change, the new one opens in the second (1.1 → 1)
//   c  a curtain: the old picture leaves upwards with the next title, the new one comes up from below, the picture
//      inside its frame moving slower than the frame
//   d  the list stands, one picture beside it fades into the next (a different layout, only to compare)
const ANIM = (() => {
	let v = new URLSearchParams(location.search).get("anim")
	const all = ["a", "b", "c", "d"]
	try {
		if (all.includes(v) || v === "off") sessionStorage.setItem("bp-anim", v)
		else v = sessionStorage.getItem("bp-anim")
	} catch (e) {}
	// b is the default since the user chose it with text 1 (25.11.2026); ?anim=off shows the way it was before
	return all.includes(v) ? v : v === "off" ? "" : "b"
})()
// b, chosen to work on (user 25.11.2026). The scene came to its step too slowly after the scroll: How in b catches up
// faster than the shared feel (lag 0.4 s, not 0.9; the pull after 0.15 s, not 0.4). Our values keeps the shared feel
// Since 26.11.2026 it follows with the spring (springer() above), not the 0.4 s follow; ?move=old shows the 0.4 s follow
const HOW_SPRING = new URLSearchParams(location.search).get("move") === "old" ? null : { w: 5, z: 0.85 }
const HOW_B_FEEL = { ...FEEL, lag: FEEL.lag ? 0.4 : 0, spring: FEEL.lag ? HOW_SPRING : null, pull: { delay: 0.15, duration: { min: 0.3, max: 0.6 }, ease: "power2.out" } }
// b: the step's text, to compare: ?text=1 | 2 | 3, remembered for the tab; 1 by default. It never moves with a mask:
//   1  a fade, the old text goes in the first half of the change, the new one comes in the second, with the picture
//   2  the fade with a small rise (10 px, easing out)
//   3  the fade line by line, a little after each other
const TEXT_FX = (() => {
	let v = new URLSearchParams(location.search).get("text")
	try { if (["1", "2", "3"].includes(v)) sessionStorage.setItem("bp-text", v); else v = sessionStorage.getItem("bp-text") } catch (e) {}
	return ["1", "2", "3"].includes(v) ? +v : 1
})()
const PIC_WIDTH = 1.3 // em
// the rows the values may stand in; a word slides along its row as a picture opens and never changes row
const VALUE_ROWS = [[[0, 3], [3, 5]], [[0, 1], [1, 3], [3, 5]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]]]
// One rule for the size, from the window's shape: a tenth of the width, more on a tall window, never more than a quarter
// of the height. The words take the fewest rows in which every row still fits with its picture open, and the size never
// grows past the three-row fit unless that is below 92px (then a phone gets one word per row): the rows follow from the
// size, so the size never jumps where the number of rows changes
function fitValues() {
	const box = $(".vd-text"), root = $(".st-val")
	if (!box) return
	const W = pageW(), H = window.innerHeight, base = 100
	box.style.fontSize = base + "px"
	const words = $$(".vd-word", box), pics = $$(".vd-pic", box), widths = words.map(w => w.getBoundingClientRect().width)
	// the gap between word and picture is a fixed length from the scale (12 → 24, css), so only the words and pictures scale
	const gap = parseFloat(getComputedStyle(box.firstElementChild || box).columnGap) || 0, room = box.offsetWidth
	const fitRow = ([a, b]) => base * (room - gap * ((b - a) * 2 - 1)) / (widths.slice(a, b).reduce((s, w) => s + w, 0) + base * PIC_WIDTH)
	const fits = VALUE_ROWS.map(rows => Math.min(...rows.map(fitRow)))
	const want = Math.min(W * 0.1 + Math.max(0, H - 0.9 * W) * 0.2, H * 0.26)
	let size = clamp(Math.min(want, Math.max(fits[1], 92), fits[2]), 48, 288)
	const pick = Math.max(0, fits.findIndex(f => f >= size - 0.5)), rows = VALUE_ROWS[pick]
	// the label and the words are one group in the middle of the screen, the label 12 above the words (user 21.11.2026, as
	// in the Manifesto; the label stood at the top of the screen and came up against the menu in smaller windows). The
	// group stays clear of the menu above and of the text below (two lines at most)
	const label = $(".val-label", root), descSize = parseFloat(getComputedStyle($(".vd-desc", root)).fontSize) || 16
	const head = label.offsetHeight + 12, above = $("#hamburger").getBoundingClientRect().bottom, below = Math.max(16, 60 * u()) + descSize * 2.7
	size = Math.max(Math.min(size, (H - head - 2 * (Math.max(above, below) + 16)) / (rows.length * 0.875)), Math.min(size, 48))
	root.style.setProperty("--val-head", head + "px")
	// the same word and picture elements move into their rows, so the scene keeps hold of them
	box.replaceChildren(...rows.map(([a, b]) => {
		const row = document.createElement("div")
		row.className = "vd-row"
		for (let i = a; i < b; i++) row.append(words[i], pics[i])
		return row
	}))
	box.style.fontSize = size + "px"
	root.style.setProperty("--vd-size", size + "px")
	root.style.setProperty("--vd-h", box.offsetHeight + "px")
}
// The opening word (test 2): as wide as the measure, or as wide as the room between the logo and the menu when the screen
// is low, whichever is larger; in the middle of the screen, never under the menu, never on the lead
function fitOpening() {
	const hero = $(".st-hero"), word = $(".ha-word", hero), lead = $(".h-lead", hero)
	if (!word) return
	const W = pageW(), H = window.innerHeight, GAP = 16, menu = $("#hamburger").getBoundingClientRect(), logo = $("#logo")
	// the letters themselves, not their line, must stay clear of the menu and the lead: their height and their place in
	// the line, from the font (at 100px)
	const pen = document.createElement("canvas").getContext("2d"), style = getComputedStyle(word)
	pen.font = `900 100px ${style.fontFamily}`
	const m = pen.measureText(word.textContent.toUpperCase()), line = parseFloat(style.lineHeight) / parseFloat(style.fontSize)
	const inkH = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 100 // in em
	const inkTop = (line - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent) / 100) / 2 + (m.fontBoundingBoxAscent - m.actualBoundingBoxAscent) / 100
	fitWidth(word, 1000)
	const ratio = word.scrollWidth / (inkH * parseFloat(word.style.fontSize)) // the word's width per height of its letters
	let w = measure()
	for (let k = 0; k < 2; k++) { // the lead starts where the word starts, and its height decides how low the word may go
		hero.style.setProperty("--ha-left", (W - w) / 2 + "px")
		const room = H - lead.offsetHeight - parseFloat(getComputedStyle(lead).bottom) - GAP
		const across = Math.min(measure(), (room - menu.bottom - GAP) * ratio)
		const between = Math.min(W - 2 * (logo.offsetLeft - pageSide() + logo.offsetWidth + 48), (room - menu.top - GAP) * ratio)
		w = Math.max(across, between)
		fitWidth(word, w)
		// the line in the middle of the screen, as long as its letters stay under the menu's top and above the lead
		const F = parseFloat(word.style.fontSize)
		hero.style.setProperty("--ha-top", Math.min(Math.max(H / 2 - word.offsetHeight / 2, menu.bottom + GAP - inkTop * F), room - (inkTop + inkH) * F) + "px")
	}
	hero.style.setProperty("--ha-left", (W - word.scrollWidth) / 2 + "px")
}
function reveal(el, text) {
	el.textContent = text
	gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: dur(0.45), ease: "power3.out", overwrite: true })
}

boot({
	render() {
		$(".st-hero").innerHTML = `<div class="st-pin">
			<div class="st-photo"><img data-pic="${OPENING_IMG}" fetchpriority="high" alt=""></div>
			<div class="ha-mask"><h1 class="ha-word display" style="visibility: hidden">Studio</h1></div>
			<p class="h-lead" style="opacity: 0">Twelve photographers. Two cities. <span>One way of looking.</span></p>
		</div>`
		// ?anim=a | d: one frame for all the pictures, under the rows (the titles pass over it)
		const one = ANIM === "a" || ANIM === "d" ? `<figure class="hw-one" aria-hidden="true">${STEPS.map(s => `<img data-pic="${s.img}" loading="lazy" alt="">`).join("")}</figure>` : ""
		$(".st-how").innerHTML = `<div class="st-pin hw" data-mode="${hwMode()}"${ANIM ? ` data-anim="${ANIM}"` : ""}><h2 class="caps hw-label">How we work</h2>${one}${STEPS.map((s, i) => `
			<div class="hw-row">
				<h3 class="hw-word"><b>${pad(i + 1)}</b> <b>${s.word}</b></h3>
				<div class="hw-body"><figure><img data-pic="${s.img}"${focus(s.img)} loading="lazy" alt=""></figure><p>${s.text}</p></div>
			</div>`).join("")}</div>`
		$(".st-mf").innerHTML = `<div class="st-pin">
			<div class="mf-in">
				<div class="mf-head"><h2 class="caps mf-label">Manifesto</h2><p class="mf-text">${SENTENCE.split(" ").map(w => `<span>${w}</span>`).join(" ")}</p></div>
				<div class="mf-strip"><span class="caps mf-count">36 frames</span><div class="mf-frames">${CONTACT_SHEET.map(src => `<img data-pic="${src}" alt="" loading="lazy">`).join("")}</div></div>
			</div>
			<div class="mf-kept"><img data-pic="${CONTACT_SHEET[KEPT]}" loading="lazy" alt=""></div>
		</div>`
		$(".st-val").innerHTML = `<div class="st-pin">
			<h2 class="caps val-label">Our values</h2>
			<div class="vd-text"><div class="vd-row">${VALUES.map(v => `<h3 class="vd-word">${v.word}</h3><span class="vd-pic"><img data-pic="${v.img}"${focus(v.img)} loading="lazy" alt=""></span>`).join("")}</div></div>
			<p class="vd-desc"></p>
		</div>`
		$(".st-cc").innerHTML = `<div class="cc-pin"><h2 class="sr-only">Clients</h2>
			<div class="cc-in">
				<div class="cc-count"><span class="cc-num display">01</span><span class="caps">/ ${CLIENTS.length} brands since ${CLIENTS[0].from}</span></div>
				<div class="cc-view"><div class="cc-roll">${CLIENTS.map(c => `<div class="cc-row"><b>${c.name}</b><span>${[...new Set(c.people)].join(", ")}</span><span>${c.from === c.to ? c.from : c.from + "–" + String(c.to).slice(2)}</span></div>`).join("")}</div></div>
			</div>
		</div>`
	},
	fit() {
		fitOpening()
		fitValues()
	},
	init(split) {
		opening(split)
		how()
		manifesto()
		values()
		clients()
	}
})

// 01 THE OPENING — the word is a hole in a dark sheet; scrolling walks into the O until the photo is all there is //
function opening(split) {
	const root = $(".st-hero"), word = $(".ha-word"), mask = $(".ha-mask")
	const chars = split(word, { type: "chars", charsClass: "char" }).chars
	fitAll() // split letters lose kerning: re-fit
	gsap.fromTo(chars, { transformOrigin: "top left", y: "-30%", scaleY: 0 }, { scaleY: 1, y: 0, duration: dur(1.5), stagger: { amount: dur(0.3) }, ease: customEase })
	// the word and the lead start unseen (inline in render()): the page is drawn before this runs (it waits for the fonts),
	// and with the photo in the browser's cache the whole word and the lead showed and vanished before the entrance (19.11.2026)
	word.style.visibility = ""
	gsap.fromTo(".h-lead", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: dur(1.1), delay: dur(0.5), ease: "expo.out" })
	// the zoom centres on the left stroke of the O, so the screen fills with photo and not with its counter.
	// The letters are still folded here, so only their x is usable
	const origin = () => {
		const o = chars[chars.length - 1].getBoundingClientRect(), w = word.getBoundingClientRect()
		return `${((o.left + o.width * 0.15 - w.left) / w.width) * 100}% 50%`
	}
	gsap.set(word, { transformOrigin: origin })
	const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: root, start: "top top", end: () => "+=" + innerHeight * 1.6, pin: $(".st-pin", root), scrub: true, invalidateOnRefresh: true } })
	tl.to(word, { scale: 70, duration: 1, ease: "power3.in" }, 0)
	tl.to(".h-lead", { opacity: 0, y: -40, duration: 0.25 }, 0)
	tl.set(mask, { autoAlpha: 0 }, 1)
	tl.fromTo(".st-photo img", { scale: 1.12 }, { scale: 1, duration: 1.2 }, 0.2)
	tl.set({}, {}, 1.4)
}

// 02 HOW WE WORK — four rows, one open; the sizes come from the window, so it always fits one screen /////////////
function how() {
	const root = $(".st-how"), pin = $(".hw", root), mode = pin.dataset.mode, label = $(".hw-label", root),
		rows = $$(".hw-row", root), words = $$(".hw-word", root), bodies = $$(".hw-body", root), figs = $$(".hw-body figure", root), texts = $$(".hw-body p", root)
	// the change to compare (?anim, top of this file): "side" keeps its own, d is drawn for the indent only
	const anim = mode === "side" || (ANIM === "d" && mode !== "indent") ? "" : ANIM
	if (!anim) delete pin.dataset.anim
	const one = $(".hw-one", root), oneImgs = one ? $$("img", one) : [], imgs = figs.map(f => $("img", f))
	let top, size, step, open, figTop, oneTop = 0, drift = 0
	const sizes = () => {
		const W = pin.offsetWidth, H = pin.offsetHeight, U = W / 1440, gutter = (W - measure()) / 2
		const k = Math.min(1, Math.max(0, (u() - 0.2604167) / 0.7395833)) // 0 at 375, 1 at 1440 (as --ku)
		top = label.offsetTop + label.offsetHeight + 8 + 8 * k // the first row 8 (phone) to 16 (desktop) under its label, on the scale (was 6 and 14)
		const bottom = Math.max(32, 64 * U) // the margin below the last row
		size = Math.max(isSmall() ? 40 : 0, Math.min(64 * u(), H * 0.09)) // a size: the size unit; the positions above follow the width (U)
		pin.style.setProperty("--hw-size", size + "px")
		step = size * (parseFloat(getComputedStyle(pin).getPropertyValue("--lh-display")) || 0.85) // a row is one line of display type (--lh-display)
		const cs = getComputedStyle(bodies[0]), PAD = parseFloat(cs.paddingTop), AFTER = parseFloat(cs.paddingBottom), gap = parseFloat(cs.rowGap) || 16 // the body's paddings (css/studio.css per mode); --gap-tight
		const textH = () => Math.max(...texts.map(p => p.offsetHeight))
		if (mode === "side") {
			// the text opens under its row, in the list's column; the picture fills the rest, from the label to the margin
			const col = Math.max(240, ...words.map(w => w.offsetWidth)), colGap = Math.max(24, 64 * U)
			texts.forEach(p => { p.style.width = col + "px" })
			open = PAD + textH() + AFTER
			figTop = label.offsetTop
			figs.forEach(f => { f.style.left = col + colGap + "px"; f.style.width = W - 2 * gutter - col - colGap + "px"; f.style.height = H - bottom - figTop + "px" })
			return
		}
		// the rows take what they need, the open one gets the rest
		open = Math.max(100, H - top - bottom - step * rows.length)
		if (mode === "column") {
			// the picture across the measure, the text under it, a group's gap before the next row
			const fh = Math.max(60, open - PAD - gap - textH() - AFTER)
			figs.forEach(f => { f.style.width = measure() + "px"; f.style.height = fh + "px" })
		} else {
			const fh = open - 24, fw = Math.min(fh * 1.6, W * 0.42)
			figs.forEach(f => { f.style.width = fw + "px"; f.style.height = fh + "px" })
		}
		// ?anim a: the one frame stands where the open row's picture stands
		if (anim === "a") {
			const f = figs[0]
			one.style.cssText = `left: ${bodies[0].offsetLeft + f.offsetLeft}px; width: ${f.offsetWidth}px; height: ${f.offsetHeight}px`
			oneTop = f.offsetTop
		}
		// ?anim c: the picture is taller than its frame by the way it lags behind it
		// ?anim b, ?text=3: the text's words in spans, grouped by the line they stand on (again on every refresh: the lines
		// follow the width)
		if (anim === "b" && TEXT_FX === 3) texts.forEach(p => {
			if (!p.lines) p.replaceChildren(...p.textContent.split(" ").flatMap((w, k) => { const s = document.createElement("span"); s.textContent = w; return k ? [" ", s] : [s] }))
			const lines = []
			$$("span", p).forEach(s => { const last = lines[lines.length - 1]; if (last && Math.abs(last[0].offsetTop - s.offsetTop) < 2) last.push(s); else lines.push([s]) })
			p.lines = lines
		})
		drift = anim === "c" ? Math.round(open * 0.12) : 0
		imgs.forEach(im => { im.style.height = drift ? `calc(100% + ${2 * drift}px)` : "" })
		// ?anim d: the list stands closed, the text under it, one picture on the right from the label to the margin
		if (anim === "d") {
			// the list's width: where its longest title ends (a title's box is as wide as its row)
			const col = Math.max(...words.map(w => w.lastElementChild.offsetLeft + w.lastElementChild.offsetWidth)) - gutter, colGap = Math.max(24, 64 * U)
			const ft = label.offsetTop, fh = H - bottom - ft, fw = Math.min(fh * 0.8, W - 2 * gutter - col - colGap)
			one.style.cssText = `left: ${W - gutter - fw}px; top: ${ft}px; width: ${fw}px; height: ${fh}px`
			bodies.forEach((b, i) => { b.style.top = (rows.length - i) * step + Math.max(16, 32 * U) + "px" })
		}
	}
	const render = t => {
		const i0 = Math.min(rows.length - 1, Math.floor(t)), fr = clamp(t - i0), f = smooth(fr)
		// ?anim a, b, d: the old one goes in the first half of the change, the new one comes in the second
		const half = i => i === i0 ? 1 - smooth(clamp(fr * 2)) : i === i0 + 1 ? smooth(clamp(fr * 2 - 1)) : 0
		let y = top
		rows.forEach((r, i) => {
			const o = i === i0 ? 1 - f : i === i0 + 1 ? f : 0
			r.style.transform = `translate3d(0,${y}px,0)`
			words[i].style.opacity = lerp(0.38, 1, o)
			if (anim) {
				if (anim === "a" || anim === "d") texts[i].style.opacity = half(i)
				else if (anim === "b") {
					// the window opens under its title as before, but never while the old one is still open; the picture
					// settles inside it (1.1 → 1), so the window opens on it rather than cutting it. Only the picture is
					// clipped: the text fades (?text), at the same time as the picture
					const shown = half(i)
					figs[i].style.clipPath = `inset(0 0 ${(1 - shown) * 100}% 0)`
					imgs[i].style.transform = `scale(${lerp(1.1, 1, shown)})`
					// the new text stands where it will stay while its row still comes up, so only the fade is seen
					const rise = TEXT_FX === 2 ? 10 * (1 - shown) ** 2 * (i === i0 ? -1 : 1) : 0
					texts[i].style.transform = `translate3d(0,${(i === i0 + 1 ? -open * (1 - f) : 0) + rise}px,0)`
					if (TEXT_FX === 3 && texts[i].lines) {
						// line by line: each line a little after the one above (and gone a little before it, going back)
						const L = texts[i].lines.length, s = 0.3
						texts[i].style.opacity = 1
						texts[i].lines.forEach((line, k) => { const q = clamp(shown * (1 + (L - 1) * s) - k * s); line.forEach(w => { w.style.opacity = q }) })
					} else texts[i].style.opacity = shown
				} else if (i === i0) {
					// c, the old one: it leaves upwards with the next title, under the edge of its own title; the picture
					// inside lags behind its frame
					const d = (1 - o) * open
					bodies[i].style.transform = `translate3d(0,${-d}px,0)`
					bodies[i].style.clipPath = `inset(${d}px 0 0 0)`
					imgs[i].style.transform = `translate3d(0,${-drift + (1 - o) * drift}px,0)`
				} else {
					// c, the new one: it comes up with its title from behind the next one, the picture lagging behind
					bodies[i].style.transform = ""
					bodies[i].style.clipPath = `inset(0 0 ${(1 - o) * 100}% 0)`
					imgs[i].style.transform = `translate3d(0,${-drift - (1 - o) * drift}px,0)`
				}
				y += anim === "d" ? step : step + open * o
				return
			}
			if (mode === "side") {
				// the text opens under its row as the body does elsewhere; the next picture opens downwards over the
				// open one, which stays whole under it, so two pictures never show through each other
				texts[i].style.clipPath = `inset(0 0 ${(1 - o) * 100}% 0)`
				const shown = i === i0 ? 1 : i === i0 + 1 ? f : 0
				figs[i].style.top = figTop - y - step + "px"
				figs[i].style.clipPath = `inset(0 0 ${(1 - shown) * 100}% 0)`
			} else bodies[i].style.clipPath = `inset(0 0 ${(1 - o) * 100}% 0)`
			y += step + open * o
		})
		// ?anim a, d: one frame, the new picture fades in over the old one and settles (1.05 → 1); in a the frame keeps
		// to the open row's place (it goes down one row's height during the change, the next title passes over it)
		if (anim === "a" || anim === "d") {
			if (anim === "a") one.style.transform = `translate3d(0,${top + (i0 + f + 1) * step + oneTop}px,0)`
			oneImgs.forEach((im, k) => {
				im.style.opacity = k === i0 ? 1 : k === i0 + 1 ? f : 0
				im.style.transform = k === i0 + 1 ? `scale(${lerp(1.05, 1, f)})` : ""
			})
		}
	}
	// b catches up faster (HOW_B_FEEL, top of this file)
	const feel = anim === "b" ? HOW_B_FEEL : FEEL, units = rows.length - 1, snap = settle(units, feel)
	const show = feel.spring ? springer(t => render(clamp(t, 0, units)), feel.spring) : follower(render, feel.lag)
	// b: the scene goes on to its step as soon as the scroll has come to rest in the middle of a change. The snap waits
	// for ScrollSmoother's smoothing to end quite (smooth: 1, site.js), and the scene stood half changed for half a
	// second (measured 25.11.2026). The snap then brings the scroll to the same step: while the scroll is on its way
	// there, the scene holds the step; any other scroll lets go
	let hold = null, seen = []
	const update = s => {
		const v = shelves(s.progress, units)
		if (hold) {
			const d = Math.sign(hold.to - hold.from)
			if (d * (v - hold.from) >= -0.01 && d * (hold.to - v) > 0.001) return show(hold.to)
			hold = null
		}
		show(v)
	}
	const rest = () => {
		if (!pin.isConnected) return gsap.ticker.remove(rest) // the page was built again
		if (hold || !st.isActive) { seen = []; return }
		const now = performance.now(), p = st.progress
		seen.push([now, p])
		while (now - seen[0][0] > 150) seen.shift()
		const t = p * (units + 0.4) - 0.2, fr = t - Math.floor(t)
		if (now - seen[0][0] < 120 || t <= 0 || t >= units || fr <= feel.edge || fr >= 1 - feel.edge) return
		if (Math.abs(p - seen[0][1]) * (units + 0.4) > 0.006) return // still moving
		hold = { from: shelves(p, units), to: shelves(snap.snapTo(p, st), units) }
		show(hold.to)
	}
	const st = ScrollTrigger.create({
		trigger: root, start: "top top", end: () => "+=" + innerHeight * rows.length * 0.6, pin, invalidateOnRefresh: true, snap,
		onRefresh: s => { sizes(); hold = null; show(shelves(s.progress, units), true) },
		onUpdate: anim === "b" ? update : s => show(shelves(s.progress, units))
	})
	if (anim === "b") gsap.ticker.add(rest)
	sizes()
	render(0)
}

// 03 MANIFESTO — the sentence lights up word by word, then "we leave things out" happens below it: the contact
// sheet goes dark frame by frame until one is kept, and that one opens to the full screen, as the frame on Home ////
function manifesto() {
	const root = $(".st-mf"), words = $$(".mf-text span", root), frames = $$(".mf-frames img", root), kept = $(".mf-kept", root), count = $(".mf-count", root)
	// the strip shows as many frames as fit in one row; the kept frame is one of them (the middle one when the strip is
	// short), and it keeps its picture: the two pictures swap places
	const shown = frames.filter(f => f.offsetTop === frames[0].offsetTop).length
	const k = shown > KEPT ? KEPT : Math.floor(shown / 2)
	if (k !== KEPT) [frames[k].src, frames[KEPT].src] = [frames[KEPT].src, frames[k].src]
	const order = frames.slice(0, shown).map((_, i) => i).filter(i => i !== k).sort((a, b) => ((a * 13) % 35) - ((b * 13) % 35))
	const clip = () => { const r = frames[k].getBoundingClientRect(), p = kept.parentNode.getBoundingClientRect(); return `inset(${r.top - p.top}px ${p.right - r.right}px ${p.bottom - r.bottom}px ${r.left - p.left}px round 3px)` }
	gsap.set(kept, { autoAlpha: 0 })
	const tl = gsap.timeline({
		defaults: { ease: "none" },
		scrollTrigger: {
			trigger: root, start: "top top", end: () => "+=" + innerHeight * 2.6, pin: $(".st-pin", root), scrub: true, invalidateOnRefresh: true,
			onUpdate: s => { count.textContent = s.progress > 0.76 ? "36 frames. 1 kept." : "36 frames" }
		}
	})
	words.forEach((w, i) => tl.to(w, { opacity: 1, duration: 0.03 }, i / words.length * 0.62))
	order.forEach((i, n) => tl.to(frames[i], { opacity: 0.08, duration: 0.03 }, 0.3 + n / order.length * 0.45))
	tl.set(kept, { autoAlpha: 1 }, 0.78)
	// the start is given, not read back from the page: when the kept frame stands in the middle of the strip, the browser
	// writes its clip with three lengths (left = right), and GSAP then paired the radius with the left edge, so the picture
	// grew from the screen's left edge instead of from the frame (seen on a phone, 13.11.2026)
	tl.fromTo(kept, { clipPath: clip }, { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 0.22, ease: "power2.inOut" }, 0.78)
	tl.set({}, {}, 1)
}

// 04 VALUES — the five rules in a few lines of type; a picture opens inside the line and pushes the words apart ////
function values() {
	const root = $(".st-val"), words = $$(".vd-word", root), pics = $$(".vd-pic", root), desc = $(".vd-desc", root), units = VALUES.length - 1
	let cur = -1
	const render = t => {
		words.forEach((w, i) => {
			const o = 1 - smooth(clamp(Math.abs(t - i)))
			w.style.opacity = lerp(0.2, 1, o)
			// never two pictures open at once, not even a sliver (user 25.11.2026): the old one closes in the first half of the
			// change, the new one opens in the second (was o: both moved at the same time)
			pics[i].style.width = `${(1 - smooth(clamp(Math.abs(t - i) * 2))) * PIC_WIDTH}em`
		})
		const near = Math.round(t)
		if (near !== cur) { cur = near; reveal(desc, VALUES[near].text) }
	}
	const show = follower(render)
	ScrollTrigger.create({
		trigger: root, start: "top top", end: () => "+=" + innerHeight * VALUES.length * 0.65, pin: $(".st-pin", root), invalidateOnRefresh: true, snap: settle(units),
		onUpdate: s => show(shelves(s.progress, units)),
		onRefresh: s => show(shelves(s.progress, units), true)
	})
	render(0)
}

// 05 CLIENTS — closing credits: the lit row stands on the count's line when the two stand side by side (user
// 24.11.2026; it stood in the middle of the window, the count at the top), in the middle of the list when the count is
// under it; the rest fades out above and below //////////////////////////////////////////////////////////////////
function clients() {
	const root = $(".st-cc"), pin = $(".cc-pin", root), box = $(".cc-in", root), view = $(".cc-view", root), roll = $(".cc-roll", root), rows = $$(".cc-row", root), num = $(".cc-num", root)
	const mid = r => r.offsetTop + r.offsetHeight / 2
	// the baseline of an element's first line, from its top: a box of no size stands on it
	const baseline = el => {
		const probe = document.createElement("i")
		probe.style.cssText = "display: inline-block; width: 0; height: 0; vertical-align: baseline"
		el.append(probe)
		const y = probe.getBoundingClientRect().top - el.getBoundingClientRect().top
		probe.remove()
		return y
	}
	// switched off 24.11.2026 (user: the lit row stood now higher, now lower when the scroll stopped between two clients);
	// the lit row is in the middle of the list again, as before. The count-line version stays here: remove "false &&"
	const beside = () => false && getComputedStyle(box).display === "grid" // css/studio.css: the count beside the list
	// the roll's y that puts a row in its place: beside the count its name stands on the number's baseline
	const at = r => {
		if (!beside()) return view.offsetHeight / 2 - mid(r)
		const name = $("b", r), line = num.getBoundingClientRect().top + baseline(num) - view.getBoundingClientRect().top
		return line - name.offsetTop - baseline(name)
	}
	// the fade above the list ends where the lit row starts, so the lit row is whole (the mask, css/studio.css)
	const fade = () => beside() ? view.style.setProperty("--cc-fade", Math.max(0, at(rows[0]) + rows[0].offsetTop) + "px") : view.style.removeProperty("--cc-fade")
	let cur = -1
	const set = i => { if (i === cur) return; cur = i; rows.forEach((r, k) => r.classList.toggle("on", k === i)); num.textContent = pad(i + 1) }
	set(0)
	fade()
	gsap.fromTo(roll, { y: () => at(rows[0]) }, {
		y: () => at(rows[rows.length - 1]), ease: "none",
		scrollTrigger: { trigger: root, start: "top top", end: () => "+=" + rows.length * innerHeight * 0.16, pin, scrub: true, invalidateOnRefresh: true, onRefresh: fade, onUpdate: s => set(Math.round(s.progress * (rows.length - 1))) }
	})
}
