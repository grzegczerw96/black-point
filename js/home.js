// BLACK POINT — HOME. The shared chrome and sections live in site.js; this file is the opening scene:
// the hero frame opens into the photographers list. themes.js provides the content.

// CONTENT /////////////////////////////////////////////////////////////////////////////////////////////////
const people = theme.roster.map((n, i) => profileFor(theme, i))
const profileUrl = p => `profile.html?p=${slug(p.name)}`

// SCENE TIMING — in screen heights of scroll. The frame opens over OPEN, then every photographer
// holds the stage for STEP; the cross-fade to the next one takes FADE around each boundary.
const OPEN = 1.2, STEP = 0.35, FADE = 0.2
const sceneLength = OPEN + people.length * STEP
const handover = i => OPEN + i * STEP          // time at which photographer i takes over (i ≥ 1)
const holdAt = i => OPEN + i * STEP + STEP / 2 // middle of photographer i's turn

let sceneTl = null

// UNDER THE NAMES: the user chose c, a darker shade over the whole photo (13.11.2026), on every window. On phones the other
// two stay to compare: ?tlo=a gradient from the names' side, ?tlo=b blur + the old 55% shade; ?tlo=c or ?tlo=0 back to c.
// The choice stays for the tab (sessionStorage), like ?scroll= in site.js
;(() => {
	let v = new URLSearchParams(location.search).get("tlo")
	try { if (/^[abc0]$/.test(v || "")) sessionStorage.setItem("bp-tlo", v); else v = sessionStorage.getItem("bp-tlo") } catch (e) {}
	if (/^[ab]$/.test(v || "")) document.documentElement.dataset.tlo = v
})()

boot({
	render() {
		// one stacked photo per photographer; the first is the hero frame
		$(".frame-in").innerHTML = people.map((p, i) => `<img data-pic="${imageFor(theme, p.name)}"${i ? "" : ' fetchpriority="high"'}${photoPos(theme, imageFor(theme, p.name))} alt="">`).join("")
		$(".h-intro ul").innerHTML = people.map((p, i) => `
			<li><h2><a class="f-50" href="${profileUrl(p)}" data-index="${i}">
				<span class="hero-split chars">${p.name}</span>
				<span class="title-hover" aria-hidden="true">${p.name}</span>
			</a></h2></li>`).join("")
	},
	fit() {
		// "WE PHOTOGRAPH" is 665 wide in the 1440 × 900 frame (144 on the scale); on wide, short windows the height decides,
		// as it does for the photo frame, or the title runs under the photo. "IN MONO." shares its size
		const [l1, l2] = $$(".hero-title .hl")
		const floor = 443 // 96 on the scale: the size where the phone and desktop layouts meet, so nothing jumps between them
		// and never taller than the room under the logo (css/home.css --fit-h): title + photo + gaps stay clear of it
		const H = window.innerHeight, gap = Math.min(Math.max(Math.min(Math.max(32 * u(), 24), 0.04 * H), 16), 48),
			room = 1.1127 * (H - 120 - 4 * gap)
		fitWidth(l1, isSmall() ? Math.min(measure(), floor, room) : Math.min(Math.max(665 * u(), floor), 665 / 900 * H, room))
		l2.style.fontSize = l1.style.fontSize
	},
	// the list lives inside the pinned scene: "team" jumps to the first photographer's turn
	scrollTo(target) {
		if (target !== "team" || !sceneTl) return false
		const st = sceneTl.scrollTrigger, y = st.start + (st.end - st.start) * holdAt(0) / sceneLength
		smoother ? smoother.scrollTo(y, true) : window.scrollTo({ top: y, behavior: "smooth" })
		return true
	},
	init: scene
})

// 01 + 02 — THE FRAME OPENS, THEN THE PHOTOGRAPHERS TAKE TURNS ////////////////////////////////////////////////
function scene(split, signal) {
	const section = $(".h-intro"), frame = $(".intro-frame"), zoom = $(".frame-zoom"), shade = $(".frame-shade"),
		imgs = $$(".frame-in img"), hoverImg = $(".frame-hover"), [l1, l2] = $$(".hero-title .hl"),
		items = $$(".h-intro li"), links = $$(".h-intro li a"), ball = $(".team-list .track"),
		capWork = $(".cap-work > span > span"), capLink = $(".cap-link")

	// the frame rectangle at rest, resolved from the CSS custom properties (--frame-w / -h / -y)
	const frameSize = () => { const p = document.createElement("div"); p.style.cssText = "position:absolute;width:var(--frame-w);height:var(--frame-h)"; section.appendChild(p); const r = [p.offsetWidth, p.offsetHeight]; p.remove(); return r }
	const rect = () => {
		const [w, h] = frameSize(), vw = section.offsetWidth, vh = section.offsetHeight,
			cy = vh * parseFloat(getComputedStyle(section).getPropertyValue("--frame-y")) / 100
		return { top: cy - h / 2, right: (vw - w) / 2, bottom: vh - cy - h / 2, left: (vw - w) / 2, w, h, vw, vh, cy }
	}
	const clipAtRest = () => { const r = rect(); return `inset(${r.top}px ${r.right}px ${r.bottom}px ${r.left}px round 6px)` }
	// the photo scales around the frame's centre, which sits below the middle of the screen: measured from
	// there it reaches less far down than up, so the shorter side decides, or the frame's bottom stays uncovered
	const zoomAtRest = () => { const r = rect(); return Math.max(r.w / r.vw, r.h / (2 * Math.min(r.cy, r.vh - r.cy))) }
	const zoomOrigin = () => { const r = rect(); return `50% ${(r.cy / r.vh) * 100}%` }

	// INTRO on load: title letters rise while the photo emerges from the page's own background colour
	const heroChars = split(".hero-title .hl", { type: "chars", charsClass: "char" })
	fitAll() // split letters lose kerning: re-fit
	const lead = split(".hero-lead", { type: "lines", linesClass: "line" })
	const leadInner = lead.lines.map(l => { const s = document.createElement("span"); s.style.display = "block"; while (l.firstChild) s.appendChild(l.firstChild); l.appendChild(s); return s })
	gsap.set(heroChars.chars, { transformOrigin: "top left", y: "-30%", scaleY: 0 })
	gsap.set(leadInner, { yPercent: 110 })
	gsap.set(frame, { clipPath: clipAtRest })
	gsap.set(zoom, { scale: zoomAtRest, transformOrigin: zoomOrigin })
	// the fade runs on .frame-in, which the scrubbed scene never touches, so scrolling during it is safe.
	// It starts once the photo is decoded (or after a moment on a slow connection), so it never fades in nothing
	const intro = gsap.timeline({ paused: true })
	intro.to(heroChars.chars, { scaleY: 1, y: 0, duration: 1.5, stagger: { amount: 0.3 }, ease: customEase }, 0)
	intro.fromTo(".frame-in", { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 2.2, ease: "power2.out" }, 0)
	intro.to(leadInner, { yPercent: 0, duration: 1.1, stagger: 0.06, ease: "expo.out" }, 0.5)
	// the lead is cut into lines only for its entrance: afterwards it is plain text again, so it re-wraps when the window
	// changes. A window change during the entrance finishes it at once, and a page rebuilt after one starts finished
	intro.eventCallback("onComplete", () => lead.revert())
	if (ctx.rebuilt) intro.progress(1)
	else Promise.race([imgs[0].decode().catch(() => {}), new Promise(r => setTimeout(r, 1200))]).then(() => { if (!signal.aborted) intro.play() })
	window.addEventListener("resize", () => { if (intro.progress() < 1) intro.progress(1) }, { signal })

	// LIST: names grow from their top edge (as in the original), the dot and caption follow
	const nameSplit = split(".h-intro .hero-split.chars", { type: "lines, words, chars", linesClass: "line", wordsClass: "word", charsClass: "char" })
	gsap.set(nameSplit.chars, { transformOrigin: "top left", y: "-30%", scaleY: 0 })
	const hovers = links.map(a => {
		const s = split(a.querySelector(".title-hover"), { type: "chars", charsClass: "char" })
		gsap.set(s.chars, { transformOrigin: "left bottom", scaleY: 0 })
		return s.chars
	})
	const arrive = gsap.timeline({ paused: true })
	arrive.set([".team-list", ".team-cap"], { visibility: "visible" })
	arrive.to(nameSplit.chars, { scaleY: 1, y: 0, duration: 1, stagger: { amount: 0.25 }, ease: "power4" })
	arrive.to(".team-list .track i", { scale: 1, duration: 0.5, ease: "power3" }, 0.3)
	arrive.from(".team-cap p > span, .cap-link", { yPercent: 110, opacity: 0, duration: 0.8, stagger: 0.06, ease: "expo.out" }, 0.3)

	// who is on stage: the active name turns accent letter by letter, the dot slides to it,
	// the caption (the project only since 13.11.2026: the "01 / 12 — name" label is gone) rolls to the new line
	let shown = -1, onStage = 0, hovering = -1
	const caption = i => `${people[i].work[0].title} · ${people[i].work[0].client} · ${people[i].work[0].year}`
	const show = i => {
		if (i === shown) return
		const prev = shown
		shown = i
		items.forEach((li, k) => li.classList.toggle("on", k === i))
		if (prev > -1) gsap.to(hovers[prev], { yPercent: 10, scaleY: 0, stagger: { amount: 0.1 }, duration: 0.45, ease: "expo", overwrite: true })
		gsap.to(hovers[i], { yPercent: 0, scaleY: 1, stagger: { amount: 0.1 }, duration: 0.5, ease: "expo", overwrite: true })
		gsap.to(ball, { y: items[i].offsetTop + (items[i].offsetHeight - ball.offsetHeight) / 2, duration: 0.5, ease: "power3", overwrite: true })
		capLink.href = profileUrl(people[i])
		if (prev === -1) { capWork.textContent = caption(i); return }
		gsap.to(capWork, {
			yPercent: -110, duration: 0.25, ease: "power3.in", overwrite: true,
			onComplete: () => {
				capWork.textContent = caption(shown) // always the latest, even after fast scrolling
				gsap.fromTo(capWork, { yPercent: 110 }, { yPercent: 0, duration: 0.45, ease: "power3.out" })
			}
		})
	}
	// the dot stands its own width left of the names (css translateX(-100%)): kept as a percentage, as GSAP would
	// otherwise freeze it in pixels at the first move and leave it off its place after a window change
	gsap.set(ball, { xPercent: -100, x: 0 })
	show(0)
	// the names now also size with the window's height, and a height change does not rebuild the page: keep the dot on its name
	window.addEventListener("resize", () => gsap.set(ball, { y: items[shown].offsetTop + (items[shown].offsetHeight - ball.offsetHeight) / 2 }), { signal })

	// SCRUBBED SCENE — pinned for the whole run
	let listIn = false
	// where the scene comes to rest: the start and the middle of each photographer's turn
	const points = [0, ...people.map((p, i) => holdAt(i) / sceneLength)]
	// on touch the move decides (version A, 13.11.2026): a move down finishes to the next photographer, a move up to the one
	// before, however short. The wheel keeps the nearer point. The direction is measured from where the finger came down,
	// not from the last frame: on the first move the address bar hides and pulls the page back a little, which reads as up
	let touchY = null
	window.addEventListener("touchstart", () => { touchY = window.scrollY }, { signal, passive: true })
	const byTouch = p => {
		const moved = touchY === null ? 0 : window.scrollY - touchY
		if (Math.abs(moved) < 24) return gsap.utils.snap(points, p) // a touch, not a move
		return moved > 0 ? (points.find(x => x >= p - 1e-4) ?? points.at(-1)) : ([...points].reverse().find(x => x <= p + 1e-4) ?? 0)
	}
	const tl = gsap.timeline({
		defaults: { ease: "none" },
		scrollTrigger: {
			trigger: section,
			start: "top top",
			end: () => "+=" + sceneLength * section.offsetHeight,
			pin: true,
			scrub: true,
			invalidateOnRefresh: true,
			snap: {
				snapTo: isMobile() ? byTouch : points,
				duration: { min: 0.3, max: 0.8 },
				delay: 0.15,
				ease: "power2.inOut",
				inertia: false, // one flick = one photographer, never a jump over several
				directional: false
			},
			onUpdate: self => {
				const t = self.progress * sceneLength
				// the list arrives as the frame reaches full-bleed, and leaves if you scroll back
				if (t > OPEN * 0.88 && !listIn) { listIn = true; arrive.timeScale(1).play(); if (ctx.settling) arrive.progress(1) }
				else if (t <= OPEN * 0.88 && listIn) { listIn = false; arrive.timeScale(2).reverse() }
				onStage = t < OPEN ? 0 : Math.min(people.length - 1, Math.floor((t - OPEN) / STEP))
				if (hovering < 0) show(onStage)
			}
		}
	})
	sceneTl = tl
	// the frame grows from the centre to full-bleed; the photo inside settles from "fit" to 1:1
	tl.fromTo(frame, { clipPath: clipAtRest }, { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: OPEN }, 0)
	tl.fromTo(zoom, { scale: zoomAtRest }, { scale: 1, duration: OPEN }, 0)
	// the two lines drift off left and right, the lead goes first
	tl.to(l1, { x: () => -(l1.offsetLeft + l1.offsetWidth + 20), duration: OPEN * 0.8 }, 0)
	tl.to(l2, { x: () => window.innerWidth - l2.offsetLeft + 20, duration: OPEN * 0.8 }, 0)
	// the lead stands just one gap below the photo: it is gone before the growing photo reaches it (at about 12% of the opening)
	tl.to(".hero-lead", { opacity: 0, y: -40, duration: OPEN * 0.1 }, 0)
	tl.to(shade, { opacity: 1, duration: OPEN * 0.4 }, OPEN * 0.6)
	// the list's visibility follows the scroll position, not only its own animation: on a fast jump to the top
	// (logo, back to top) that animation is slower than the scroll and the names would reach the hero
	tl.fromTo(".team-layer", { opacity: 0 }, { opacity: 1, duration: OPEN * 0.04 }, OPEN * 0.86)
	// every next photographer fades in over the previous one
	imgs.slice(1).forEach((img, k) => tl.to(img, { opacity: 1, duration: FADE }, handover(k + 1) - FADE / 2))
	tl.set({}, {}, sceneLength) // the last one keeps the stage for a full STEP

	// clicking a name or the caption link goes to the profile
	;[...links, capLink].forEach(a => a.addEventListener("click", e => { e.preventDefault(); leaveTo(a.href) }, { signal }))

	// desktop: hovering a name previews that photographer over the scroll-driven one
	if (!isDesktop()) return
	const hoverTag = hoverImg.querySelector("img")
	links.forEach((a, i) => {
		a.addEventListener("mouseenter", () => {
			hovering = i
			show(i)
			if (i === onStage) return gsap.to(hoverImg, { opacity: 0, duration: 0.4, ease: "power2", overwrite: true })
			hoverTag.src = imgs[i].src
			gsap.fromTo(hoverImg, { opacity: 0, filter: "blur(15px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "power2", overwrite: true })
		}, { signal })
	})
	$(".h-intro ul").addEventListener("mouseleave", () => {
		hovering = -1
		show(onStage)
		gsap.to(hoverImg, { opacity: 0, filter: "blur(15px)", duration: 0.4, ease: "power2", overwrite: true })
	}, { signal })
}
