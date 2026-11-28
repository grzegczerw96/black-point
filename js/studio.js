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
// a length written in CSS (a token, var(), calc()), in px, measured inside el (where its variables apply)
const cssLen = (el, v) => { const p = document.createElement("div"); p.style.cssText = `position:absolute;visibility:hidden;height:${v}`; el.appendChild(p); const h = p.offsetHeight; p.remove(); return h }
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
// SKETCH to judge (user 26.11.2026: one swipe of the wheel can go one step and start the next), ?krok=a | b, remembered
// for the tab like ?snap=; ?krok=off goes back. Quick and unchecked (touch, keyboard, window changes):
//   a  one gesture, one step: while How we work or Our values stands, the wheel does not scroll the page; each gesture
//      goes exactly one step and the wheel waits until the gesture has ended; past the first and last step it scrolls on
//   b  longer steps: twice the scroll for a step, the change in the middle 24 % of it (was 44 %), so a swipe ends on a shelf
const KROK = (() => {
	let v = new URLSearchParams(location.search).get("krok")
	try { if (["a", "b", "off"].includes(v)) sessionStorage.setItem("bp-krok", v); else v = sessionStorage.getItem("bp-krok") } catch (e) {}
	return ["a", "b"].includes(v) ? v : v === "off" ? "" : "a" // a chosen by the user 26.11.2026 ("zdecydowanie")
})()
const STEP_LONG = KROK === "b" ? 2 : 1
// ?mfz=a: the Manifesto's kept frame growing to the full screen on a spring (manifesto()); the default since 26.11.2026
const MFZ = (() => {
	let v = new URLSearchParams(location.search).get("mfz")
	try { if (["a", "off"].includes(v)) sessionStorage.setItem("bp-mfz", v); else v = sessionStorage.getItem("bp-mfz") } catch (e) {}
	return v === "off" ? "" : "a" // a by default since 26.11.2026 (refined with the user, sent to Pages); ?mfz=off the way it was
})()
// ?pic=a | b: sketches of the picture opening in How we work (how(), setPic()); the way it was by default
const PIC = (() => {
	let v = new URLSearchParams(location.search).get("pic")
	try { if (["a", "b", "off"].includes(v)) sessionStorage.setItem("bp-pic", v); else v = sessionStorage.getItem("bp-pic") } catch (e) {}
	return ["a", "b"].includes(v) ? v : ""
})()
// How we work in the middle of the window: ?hwc=1 | 2 (how(), sizes()); 1 by default since 26.11.2026, ?hwc=0 the way it was
const HWC = (() => {
	let v = new URLSearchParams(location.search).get("hwc")
	try { if (["1", "2", "0"].includes(v)) sessionStorage.setItem("bp-hwc", v); else v = sessionStorage.getItem("bp-hwc") } catch (e) {}
	return ["1", "2"].includes(v) ? +v : v === "0" ? 0 : 1 // 1 chosen by the user 26.11.2026; ?hwc=0 the way it was
})()
const FEEL = (f => KROK === "b" ? { ...f, edge: 0.38 } : f)(FEELS[(() => {
	let v = new URLSearchParams(location.search).get("snap")
	try { if (v in FEELS) sessionStorage.setItem("bp-snap", v); else v = sessionStorage.getItem("bp-snap") } catch (e) {}
	return v in FEELS ? v : "b" // b chosen by the user 24.11.2026 (was a); a and c stay to compare
})()])
// ?krok=a: the wheel inside a standing scene. A gesture is a run of wheel events with less than 200 ms between them (a
// trackpad's coasting counts as the same gesture); it moves the scroll to the middle of the next step's shelf
// ?kolejka=1, SKETCH (user 26.11.2026: someone who scrolls fast; "the next picture when a second scroll starts, once the
// last one has settled"): a new gesture during a step is kept, one at most, and its step starts as soon as the step under
// way has come to rest (850 ms after it began). Without it (the default) such a gesture is ignored
const QUEUE = (() => {
	let v = new URLSearchParams(location.search).get("kolejka")
	try { if (["1", "0"].includes(v)) sessionStorage.setItem("bp-kolejka", v); else v = sessionStorage.getItem("bp-kolejka") } catch (e) {}
	return v !== "0" // the queue by default since the user liked it (26.11.2026, "jest spoko"); ?kolejka=0 ignores as before
})()
const oneStep = (st, units, alive, touch = false) => {
	if (KROK !== "a") return
	let busy = false, last = 0, began = 0, goal = 0, queued = 0
	const at = k => st.start + (st.end - st.start) * (k + 0.2) / (units + 0.4)
	const go = dir => {
		goal = clamp(goal + dir, 0, units); began = performance.now(); busy = true
		setScroll(at(goal)) // ScrollSmoother eases the page there, the scene follows with its own catching up
	}
	const free = () => {
		const now = performance.now()
		if (QUEUE && queued && now - began >= 850) {
			const d = queued; queued = 0
			if ((d > 0 && goal < units) || (d < 0 && goal > 0)) { go(d); return setTimeout(free, 50) }
		}
		if (now - last >= 200 && now - began >= (QUEUE ? 850 : 700) && !queued) busy = false
		else setTimeout(free, 50)
	}
	const wheel = e => {
		if (!alive()) return window.removeEventListener("wheel", wheel, { capture: true })
		const now = performance.now(), gap = now - last
		last = now
		if (!st.isActive) return
		const dir = Math.sign(e.deltaY)
		if (!busy) goal = Math.round(shelves(st.progress, units))
		if (!busy && ((dir < 0 && goal === 0) || (dir > 0 && goal === units))) return // leave the scene: the page scrolls
		e.preventDefault(); e.stopImmediatePropagation()
		if (busy) {
			if (QUEUE && gap >= 200) queued = dir // a new gesture while a step is under way: kept for later (one at most)
			return // the same gesture, or the step still under way
		}
		go(dir)
		setTimeout(free, 700)
	}
	window.addEventListener("wheel", wheel, { capture: true, passive: false })
	if (touch && ScrollTrigger.isTouch && TOUCH_STEP) touchSteps()
	// One swipe, one step (user 28.11.2026, on a phone: one swipe in Our values could go several steps; Our values
	// accepted on the phone the same day, then How we work too). On touch the page glides on
	// after the finger lifts (site.js, normalizeScroll), so a flick carried two or three steps. Inside the standing scene
	// a swipe now goes exactly one step as soon as the finger has moved 8 px, the page does not glide, and the rest of
	// the swipe does nothing; past the first and last step the page scrolls as usual. The script that scrolls the page
	// never sees such a swipe (stopped on the window, before it). ?palec=0 shows the way it was
	function touchSteps() {
		let y0 = null, mine = false
		const opts = { capture: true, passive: false }
		const down = e => { y0 = e.touches[0].clientY; mine = false }
		const move = e => {
			if (!alive()) return off()
			if (y0 === null || !st.isActive) return
			if (!mine) {
				const dy = y0 - e.touches[0].clientY
				if (Math.abs(dy) < 8) return
				const dir = Math.sign(dy)
				if (!busy) goal = Math.round(shelves(st.progress, units))
				if (!busy && ((dir < 0 && goal === 0) || (dir > 0 && goal === units))) { y0 = null; return } // leave the scene
				mine = true
				if (busy) { if (QUEUE) queued = dir } // a new swipe while a step is under way: kept for later, as with the wheel
				else { go(dir); setTimeout(free, 700) }
			}
			last = performance.now()
			e.preventDefault(); e.stopImmediatePropagation()
		}
		const up = e => { if (mine) e.stopImmediatePropagation(); mine = false; y0 = null }
		const off = () => { window.removeEventListener("touchstart", down, opts); window.removeEventListener("touchmove", move, opts); window.removeEventListener("touchend", up, opts) }
		window.addEventListener("touchstart", down, opts)
		window.addEventListener("touchmove", move, opts)
		window.addEventListener("touchend", up, opts)
	}
}
const TOUCH_STEP = new URLSearchParams(location.search).get("palec") !== "0"
const OPENING_LAG = (v => v === null ? 2 : +v > 0 ? +v : true)(new URLSearchParams(location.search).get("scrub"))
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
	const head = label.offsetHeight + cssLen(root, "var(--label-gap-values, 1.5rem)"), above = $("#hamburger").getBoundingClientRect().bottom, below = Math.max(16, 60 * u()) + descSize * 2.7
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
	const W = pageW(), H = window.innerHeight, GAP = 16, LEAD_GAP = 32, menu = $("#hamburger").getBoundingClientRect(), logo = $("#logo")
	// the letters themselves, not their line, must stay clear of the menu (16) and the lead (32; 16 until 26.11.2026, the
	// user: more room between the word and the lead): their height and their place in the line, from the font (at 100px)
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
		const room = H - lead.offsetHeight - parseFloat(getComputedStyle(lead).bottom) - LEAD_GAP
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
	// on touch the scene catches up with the scroll over OPENING_LAG seconds, 2 (user 28.11.2026 on a phone, accepted the same day: a fast
	// swipe up turned the full photo back into the word in a moment). With the mouse ScrollSmoother already smooths the
	// scroll by 1 s (site.js); on a phone nothing did. Measured: the word shrinking out of the photo took 0.22 s of a fast
	// swipe, 0.28 s with 1, 0.45 s with 2. ?scrub=0 shows the way it was, ?scrub=1 another lag
	const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: root, start: "top top", end: () => "+=" + innerHeight * 1.6, pin: $(".st-pin", root), scrub: touchScroll ? OPENING_LAG : true, invalidateOnRefresh: true } })
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
		let bottom = Math.max(32, 64 * U) // the margin below the last row
		// TO COMPARE (user 26.11.2026: "it fills the screen, so why the space above? can it be centred like Our values?"),
		// ?hwc=1 | 2, not in "side":
		//   1  the group in the middle, the picture as large as before: the label goes up, never closer than 24 to the menu
		//   2  the group in the middle with equal margins: the bottom margin as the label's top, the picture smaller
		label.style.top = ""
		if (HWC && mode !== "side") {
			const t0 = label.offsetTop, least = $("#hamburger").getBoundingClientRect().bottom + 24
			if (HWC === 1) { const t = Math.max(least, (t0 + bottom) / 2); bottom = t0 + bottom - t; label.style.top = t + "px" }
			else bottom = t0
		}
		top = label.offsetTop + label.offsetHeight + cssLen(pin, "var(--label-gap, 1rem)") // the first row --label-gap under its label (16; was 8 on a phone to 16, user 26.11.2026)
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
	// b: how open each picture is. The text comes in as its picture ends opening (user 26.11.2026: "a little later, about
	// when the picture has opened"; 70 % was a little late, 60 % since): from 60 % open to fully open; it goes in the same way, early in the closing.
	// ?pic=a | b, SKETCHES to judge (user 26.11.2026: on a large screen the picture opens robotic and very fast, with no
	// natural acceptance of the end): the picture opens on its own spring, softer than the rows' (w 5, no overshoot: 95 % about
	// 1.1 s after it starts), and settles inside its window more slowly still (scale, w 3.2), so the end is seen to come to rest;
	// closing follows the scene at once, so two pictures are never open together.
	//   a  the window opens downwards as now, softly
	//   b  no window: the picture fades in and settles (1.06 → 1)
	const soft = PIC ? figs.map(() => ({ to: 0, open: 0, v: 0, sc: 0, vs: 0 })) : null
	const drawPic = (i, open, sc) => {
		if (PIC === "b") { figs[i].style.clipPath = ""; figs[i].style.opacity = open }
		else figs[i].style.clipPath = `inset(0 0 ${(1 - open) * 100}% 0)`
		imgs[i].style.transform = `scale(${lerp(PIC === "b" ? 1.06 : 1.1, 1, sc)})`
		if (TEXT_FX === 1) texts[i].style.opacity = smooth(clamp((open - 0.6) / 0.4))
	}
	const softTick = () => {
		if (!pin.isConnected) return gsap.ticker.remove(softTick)
		const dt = Math.min(0.05, gsap.ticker.deltaRatio() / 60)
		let still = true
		soft.forEach((p, i) => {
			for (let left = dt; left > 0; left -= 1 / 240) {
				const h = Math.min(left, 1 / 240)
				p.v += (25 * (p.to - p.open) - 10 * p.v) * h; p.open += p.v * h // w 5, z 1
				p.vs += (10.24 * (p.to - p.sc) - 6.4 * p.vs) * h; p.sc += p.vs * h // w 3.2, z 1
			}
			if (Math.abs(p.to - p.open) < 0.001 && Math.abs(p.v) < 0.01) { p.open = p.to; p.v = 0 } else still = false
			if (Math.abs(p.to - p.sc) < 0.001 && Math.abs(p.vs) < 0.01) { p.sc = p.to; p.vs = 0 } else still = false
			drawPic(i, p.open, p.sc)
		})
		if (still) gsap.ticker.remove(softTick)
	}
	const setPic = (i, to) => {
		if (!soft) return drawPic(i, to, to)
		const p = soft[i]
		p.to = to
		if (to < p.open || !dur(1)) { p.open = to; p.v = 0 } // closing, or a rebuilt page: at once
		if (to < p.sc || !dur(1)) { p.sc = to; p.vs = 0 }
		drawPic(i, p.open, p.sc)
		if (p.open !== to || p.sc !== to) gsap.ticker.add(softTick)
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
					setPic(i, shown) // the picture, and with it the text (?pic, setPic() above)
					// the new text stands where it will stay while its row still comes up, so only the fade is seen
					const rise = TEXT_FX === 2 ? 10 * (1 - shown) ** 2 * (i === i0 ? -1 : 1) : 0
					texts[i].style.transform = `translate3d(0,${(i === i0 + 1 ? -open * (1 - f) : 0) + rise}px,0)`
					if (TEXT_FX === 3 && texts[i].lines) {
						// line by line: each line a little after the one above (and gone a little before it, going back)
						const L = texts[i].lines.length, s = 0.3
						texts[i].style.opacity = 1
						texts[i].lines.forEach((line, k) => { const q = clamp(shown * (1 + (L - 1) * s) - k * s); line.forEach(w => { w.style.opacity = q }) })
					} else if (TEXT_FX !== 1) texts[i].style.opacity = shown
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
		trigger: root, start: "top top", end: () => "+=" + innerHeight * rows.length * 0.6 * STEP_LONG, pin, invalidateOnRefresh: true, snap,
		onRefresh: s => { sizes(); hold = null; show(shelves(s.progress, units), true) },
		onUpdate: anim === "b" ? update : s => show(shelves(s.progress, units))
	})
	if (anim === "b") gsap.ticker.add(rest)
	oneStep(st, units, () => pin.isConnected, true)
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
	// ?mfz=a: the scene stands a little longer after the frame is kept (1.12 instead of 1), so the picture fills the screen
	// before the page goes on, and the hold stays short (1.5 felt like a pause that held the scroll, user 26.11.2026)
	const T = MFZ ? 1.12 : 1
	const tl = gsap.timeline({
		defaults: { ease: "none" },
		scrollTrigger: {
			trigger: root, start: "top top", end: () => "+=" + innerHeight * 2.6 * T, pin: $(".st-pin", root), scrub: true, invalidateOnRefresh: true,
			onUpdate: s => { count.textContent = s.progress * T > 0.76 ? "36 frames. 1 kept." : "36 frames" }
		}
	})
	words.forEach((w, i) => tl.to(w, { opacity: 1, duration: 0.03 }, i / words.length * 0.62))
	order.forEach((i, n) => tl.to(frames[i], { opacity: 0.08, duration: 0.03 }, 0.3 + n / order.length * 0.45))
	if (!MFZ) tl.set(kept, { autoAlpha: 1 }, 0.78)
	// the start is given, not read back from the page: when the kept frame stands in the middle of the strip, the browser
	// writes its clip with three lengths (left = right), and GSAP then paired the radius with the left edge, so the picture
	// grew from the screen's left edge instead of from the frame (seen on a phone, 13.11.2026)
	if (!MFZ) tl.fromTo(kept, { clipPath: clip }, { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 0.22, ease: "power2.inOut" }, 0.78)
	tl.set({}, {}, T)
	// ?mfz=a, SKETCH (user 26.11.2026: the kept frame grows to the full screen with no gentleness). The scroll gives how far
	// the picture has grown (from the kept frame at 0.78 to the full screen at 0.9 of the scene), a spring follows it
	// (w 8, no overshoot), so it starts softly and settles, and the hold after it is short. The picture really grows: at the
	// start it stands exactly where and how large it is in the strip (the same crop), so going back it shrinks into its
	// frame and becomes it, with nothing to jump (user 26.11.2026: going back a rounded picture of another crop jumped in,
	// slowly; further scrolling should go on to the words)
	if (MFZ) {
		const img = $("img", kept), st = tl.scrollTrigger
		let at = 0, v = 0, to = 0
		const draw = () => {
			const r = frames[k].getBoundingClientRect(), p = kept.getBoundingClientRect(), e = clamp(at)
			const iw = img.naturalWidth || frames[k].naturalWidth || 1600, ih = img.naturalHeight || frames[k].naturalHeight || 1000
			const s0 = Math.max(r.width / iw, r.height / ih) / Math.max(p.width / iw, p.height / ih)
			const dx = r.left + r.width / 2 - p.left - p.width / 2, dy = r.top + r.height / 2 - p.top - p.height / 2
			const q = [r.top - p.top, p.right - r.right, p.bottom - r.bottom, r.left - p.left].map(x => x * (1 - e))
			kept.style.clipPath = `inset(${q[0]}px ${q[1]}px ${q[2]}px ${q[3]}px round ${3 * (1 - e)}px)`
			// the picture's own box at its full-screen size (object-fit would crop it to the screen's shape first, and the
			// shrunk picture was then lower than its frame: the strip showed under it, 26.11.2026)
			const sK = Math.max(p.width / iw, p.height / ih), w = iw * sK, h = ih * sK
			img.style.cssText = `position:absolute;max-width:none;left:${(p.width - w) / 2}px;top:${(p.height - h) / 2}px;width:${w}px;height:${h}px;transform:translate(${dx * (1 - e)}px, ${dy * (1 - e)}px) scale(${lerp(s0, 1, e)})`
			kept.style.visibility = at > 0.002 || to > 0 ? "visible" : "hidden"
			kept.style.opacity = 1
		}
		const tick = () => {
			if (!root.isConnected) return gsap.ticker.remove(tick)
			for (let left = Math.min(0.05, gsap.ticker.deltaRatio() / 60); left > 0; left -= 1 / 240) {
				const h = Math.min(left, 1 / 240)
				// going back the spring is stiffer (w 12, was 8): the picture comes into its frame quicker, so the end is not
				// seen to linger (user 26.11.2026)
				const back = to < at, ww = back ? 144 : 64, zz = back ? 24 : 16
				v += (ww * (to - at) - zz * v) * h; at += v * h
			}
			if (!dur(1) || (Math.abs(to - at) < 0.002 && Math.abs(v) < 0.02)) { at = to; v = 0; gsap.ticker.remove(tick) }
			draw()
		}
		const aim = (p, now) => {
			to = clamp((p * T - 0.78) / 0.12)
			if (now) { at = to; v = 0; return draw() }
			gsap.ticker.add(tick)
		}
		ScrollTrigger.create({ trigger: root, start: () => st.start, end: () => st.end, onUpdate: s => aim(s.progress), onRefresh: s => aim(s.progress, true) })
		aim(st.progress, true)
	}
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
	const st = ScrollTrigger.create({
		trigger: root, start: "top top", end: () => "+=" + innerHeight * VALUES.length * 0.65 * STEP_LONG, pin: $(".st-pin", root), invalidateOnRefresh: true, snap: settle(units),
		onUpdate: s => show(shelves(s.progress, units)),
		onRefresh: s => show(shelves(s.progress, units), true)
	})
	oneStep(st, units, () => root.isConnected && words[0].isConnected, true)
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
