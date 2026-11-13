// BLACK POINT — CONTACT. The shared chrome and sections live in site.js; this file is the opening film
// (cut A of lab-contact.html): chapter cards, nature shots, the story told in subtitles.

// CONTENT /////////////////////////////////////////////////////////////////////////////////////////////////
const IMG = id => `img/film/${id}.jpg`
// one shot per beat of the story; `sub` is the shot's subtitles, cut by hand; `pos` keeps the subject in
// frame when the shot is cropped. No photo that already appears on the page (the deer is the Lisbon studio).
const STORY = [
	{ img: 11, pos: "50% 55%", sub: ["Every job starts quietly,", "before anyone lifts a camera."] },
	{ img: 1001, pos: "84% 50%", sub: ["We ask who you are, what you need", "and what you would rather not show."] },
	{ img: 29, pos: "50% 40%", sub: ["Then we wait.", "For the light to turn,"] },
	{ img: 1074, pos: "50% 30%", sub: ["for the moment", "people stop performing."] },
	{ img: 16, pos: "50% 60%", sub: ["Small crews, long days.", "Nobody on set is a prop."] },
	{ img: 1044, pos: "50% 50%", sub: ["We tell you the truth about the pictures", "and we keep our word on dates."] },
	{ img: 1056, pos: "50% 35%", sub: ["Twelve photographers.", "One studio. Your story."] }
]
const CHAPTERS = [{ no: "I", word: "Listen", at: 0 }, { no: "II", word: "Wait", at: 2 }, { no: "III", word: "Keep", at: 4 }]

// the subtitle for shot i at local progress f (0–1): silence at both ends of the shot; after a chapter card
// the picture gets a moment on its own before anyone speaks
const subAt = (i, f, start = 0.1) => {
	const s = STORY[i].sub
	if (f < start || f > 0.94) return ["", ""]
	const k = Math.min(s.length - 1, Math.floor((f - start) / (0.94 - start) * s.length))
	return [`${i}-${k}`, s[k]]
}

boot({
	render() {
		$(".c-story .film-pin").innerHTML = `
			${STORY.map((s, i) => `<div class="film-shot"><img data-pic="${IMG(s.img)}"${i ? "" : ' fetchpriority="high"'} style="object-position:${s.pos}" alt=""></div>`).join("")}
			${CHAPTERS.map(c => `<div class="ka-card"><span class="caps">Chapter ${c.no}</span><span class="display">${c.word}</span></div>`).join("")}
			<div class="film-top"><span class="caps">Black Point — how we work</span><span class="caps film-no"></span></div>
			<p class="film-sub"></p>
			<div class="film-end"><span class="caps">New work</span><h3 class="display">Tell us what you are making</h3><a class="mail" href="mailto:studio@blackpoint.studio">studio@blackpoint.studio</a></div>`
	},
	init: film
})

// THE FILM — pinned; scrolling plays it ///////////////////////////////////////////////////////////////////////
function film() {
	const root = $(".c-story"), shots = $$(".film-shot", root), cards = $$(".ka-card", root), end = $(".film-end", root),
		no = $(".film-no", root), subEl = $(".film-sub", root)
	let key = null
	const sub = (k, text) => {
		if (k === key) return
		key = k
		if (!text) return gsap.to(subEl, { opacity: 0, duration: 0.2, overwrite: true })
		subEl.innerHTML = `<span>${text}</span>`
		gsap.fromTo(subEl, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, overwrite: true })
	}
	let endShown = null
	const showEnd = on => {
		if (on === endShown) return // only on a change: restarted on every scroll tick, the fade never finished
		endShown = on
		gsap.to(end,{ autoAlpha: on ? 1 : 0, y: on ? 0 : 24, duration: 0.6, ease: "power3.out", overwrite: true })
		gsap.to($(".film-top", root), { autoAlpha: on ? 0 : 1, duration: 0.3, overwrite: true }) // the film is over: no more labels
	}

	// the edit: a title card before each chapter, then its shots, then the end card
	const segs = []
	let t = 0
	STORY.forEach((_, i) => {
		const c = CHAPTERS.findIndex(ch => ch.at === i)
		if (c > -1) { segs.push({ type: "card", c, t, d: 0.6 }); t += 0.6 }
		segs.push({ type: "shot", i, t, d: 1, afterCard: c > -1 }); t += 1
	})
	segs.push({ type: "end", t, d: 1 })
	const total = t + 1
	const update = time => {
		const s = segs.find(x => time < x.t + x.d) || segs[segs.length - 1]
		showEnd(s.type === "end")
		if (s.type !== "shot") return sub("", "")
		no.textContent = `${pad(s.i + 1)} / ${pad(STORY.length)}`
		sub(...subAt(s.i, (time - s.t) / s.d, s.afterCard ? 0.3 : 0.1))
	}

	const tl = gsap.timeline({
		defaults: { ease: "none" },
		scrollTrigger: { trigger: root, start: "top top", end: () => "+=" + innerHeight * total * 0.9, pin: $(".film-pin", root), scrub: true, invalidateOnRefresh: true, onUpdate: st => update(st.progress * total) }
	})
	segs.forEach(s => {
		if (s.type === "card") {
			// a hard cut: the card covers the screen, the old shot is struck behind it and the next shot is
			// already in place when the card lifts — nothing from before shows through
			const card = cards[s.c], next = CHAPTERS[s.c].at
			if (s.t > 0) tl.fromTo(card, { opacity: 0 }, { opacity: 1, duration: 0.15 }, s.t)
			tl.set(shots.slice(0, next), { opacity: 0 }, s.t + 0.16)
			tl.set(shots[next], { opacity: 1 }, s.t + 0.2)
			tl.fromTo($(".display", card), { scale: 0.94 }, { scale: 1, duration: s.d }, s.t)
			tl.to(card, { opacity: 0, duration: 0.15 }, s.t + s.d - 0.15)
		}
		if (s.type === "shot") {
			if (!s.afterCard) tl.fromTo(shots[s.i], { opacity: 0 }, { opacity: 1, duration: 0.12 }, s.t - 0.06)
			tl.fromTo($("img", shots[s.i]), { scale: 1.12 }, { scale: 1, duration: s.d + 0.15 }, s.t - (s.afterCard ? 0.15 : 0))
		}
		if (s.type === "end") tl.to(shots, { opacity: 0, duration: 0.3 }, s.t)
	})
	tl.set({}, {}, total) // the timeline lasts exactly `total`, so pictures and subtitles stay in step
	gsap.set(cards[0], { opacity: 1 })
	update(0)
}
