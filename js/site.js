// BLACK POINT — shared by every page of the site: the chrome (logo, menu, page transition), the studios and
// contact sections, and the page lifecycle. A page script calls boot({ render, fit, init, scrollTo }).

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, CustomEase)
gsap.config({ nullTargetWarn: false })

const theme = themes.find(t => t.id === "blackpoint")
const customEase = CustomEase.create("custom", "M0,0 C0.25,0 0.288,-0.004 0.404,0.112 0.54,0.248 0.487,0.707 0.594,0.882 0.65,0.974 0.698,1 1,1 ")
const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || matchMedia("(hover: none) and (pointer: coarse)").matches
const isDesktop = () => !isMobile() && window.innerWidth > 1024
const isSmall = () => window.innerWidth <= 768
const pad = n => String(n).padStart(2, "0")
const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]

// SIZE UNIT /////////////////////////////////////////////////////////////////////////////////////////////////
// --u in css/tokens.css and u() here: one Figma pixel, the unit of every size (type, gaps, pictures). It is the smaller
// of two ratios, window width to the width of a reference frame and window height to its height, so a tall, empty
// screen gets larger type and a low one smaller. The window's shape picks the frame, not its width alone:
//   desktop 1440 × 900, tablet held upright 834 × 1080 (an assumption, from Hvera), phone 375 × 812.
// Each frame says what one unit is at its own size: 1 on the desktop and on the tablet (the tablet frame shows the
// desktop sizes), 375 / 1440 on the phone (the phone is the 1440 design scaled down, its sizes held by the rem limits).
// Between the shapes the frames blend over a band of aspect ratios (smoothstep), so no size ever jumps. A window counts
// as a tablet only when it is also wide enough: a phone whose browser bars make the window squat stays a phone.
// At 1440 × 900 and 375 × 812 the unit is exactly what 100vw / 1440 gave before.
// The grid (--margin, --gutter, measure()) and the logo and menu still follow the width alone.
const FRAMES = { phone: [375, 812, 375 / 1440], tablet: [834, 1080, 1], desktop: [1440, 900, 1] },
	PHONE_TO_TABLET = [0.48, 0.69], TABLET_TO_DESKTOP = [0.85, 1.25], // aspect ratio W / H
	TABLET_WIDTH = [480, 600], UNIT_LIMITS = [0.2, 2]
function unitFor(W, H) {
	const frame = ([w, h, s]) => s * Math.min(W / w, H / h)
	const band = ([lo, hi], x = W / H) => { const t = Math.min(1, Math.max(0, (x - lo) / (hi - lo))); return t * t * (3 - 2 * t) }
	const p = band(PHONE_TO_TABLET) * band(TABLET_WIDTH, W), d = band(TABLET_TO_DESKTOP)
	const portrait = frame(FRAMES.phone) * (1 - p) + frame(FRAMES.tablet) * p
	return Math.min(UNIT_LIMITS[1], Math.max(UNIT_LIMITS[0], portrait * (1 - d) + frame(FRAMES.desktop) * d))
}
let sizeUnit = 1
function setUnit() {
	sizeUnit = unitFor(window.innerWidth, window.innerHeight)
	document.documentElement.style.setProperty("--u", sizeUnit + "px")
}
setUnit()

const rootTag = document.documentElement,
	bodyTag = document.body,
	wrapperTag = $("#smooth-wrapper"),
	contentTag = $("#smooth-content")

// NAVIGATION ////////////////////////////////////////////////////////////////////////////////////////////////
const NAV = [["Our team", "team.html"], ["Projects", "projects.html"], ["Studio", "studio.html"], ["Contact", "contact.html"]]
const here = location.pathname.split("/").pop() || "home.html"
// a link either points at a section of this page (returns its id) or at another page (returns null)
const localTarget = href => {
	const [page, id] = href.split("#")
	return !page || page === here ? id || "top" : null
}

// SHARED SECTIONS ///////////////////////////////////////////////////////////////////////////////////////////
const STUDIOS_HTML = `
	<div class="studios-frame">
		<a class="city" href="https://maps.google.com/?q=Rua+das+Flores+28,+Lisbon" target="_blank" rel="noopener" data-tz="Europe/Lisbon">
			<figure><img src="img/studio-lisbon.jpg" alt="Fallow deer in a forest clearing"></figure>
			<div class="city-txt">
				<h2>Lisbon</h2>
				<div class="city-info">
					<p class="addr"><span>Rua das Flores 28</span></p>
					<p class="tel"><span>+351 21 000 0000</span></p>
				</div>
			</div>
		</a>
		<a class="city" href="https://maps.google.com/?q=ul.+Mokotowska+12,+Warsaw" target="_blank" rel="noopener" data-tz="Europe/Warsaw">
			<figure><img src="img/studio-warsaw.jpg" alt="Curved facade of folded metal strips"></figure>
			<div class="city-txt">
				<h2>Warsaw</h2>
				<div class="city-info">
					<p class="addr"><span>ul. Mokotowska 12</span></p>
					<p class="tel"><span>+48 22 000 00 00</span></p>
				</div>
			</div>
		</a>
	</div>`

// "Get in touch" opens the Contact page; on the Contact page itself it writes an e-mail
const CONTACT_HTML = cta => `
	<div class="contact-grid">
		<div class="view">
			<span class="lbl">New work</span>
			<div class="lines">
				<a href="mailto:studio@blackpoint.studio" class="u-link">studio@blackpoint.studio</a>
				<a href="tel:+351210000000" class="u-link">+351 21 000 0000</a>
			</div>
		</div>
		<div class="view">
			<span class="lbl">Studios</span>
			<div class="lines">
				<span>Rua das Flores 28, Lisbon</span>
				<span>ul. Mokotowska 12, Warsaw</span>
			</div>
		</div>
		<div class="view">
			<span class="lbl">Follow</span>
			<div class="lines">
				<a href="#" class="u-link">Instagram</a>
				<a href="#" class="u-link">Vimeo</a>
				<a href="#" class="u-link">LinkedIn</a>
			</div>
		</div>
		<div class="view right">
			<span class="lbl">Local time</span>
			<div class="lines">
				<span class="local-time">Lisbon <b data-tz="Europe/Lisbon"></b> &middot; Warsaw <b data-tz="Europe/Warsaw"></b></span>
			</div>
		</div>
	</div>
	<div class="cta-row">
		<a href="${cta}" class="cta" aria-label="Get in touch">
			<span>Get in touch</span><span aria-hidden="true">Get in touch</span>
		</a>
		<a href="${cta}" class="cta-disc" aria-label="Get in touch"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 17.5 17 7M8.5 6.5H17.5V15.5" fill="none" stroke="currentColor" stroke-width="2.6"/></svg></a>
	</div>
	<div class="foot-bar">
		<span>&copy; 2026 Black Point</span>
		<span>Photography in mono</span>
		<a href="#top" class="to-top">Back to top &uarr;</a>
	</div>`

function render() {
	// logo: first letter plays the original "O"
	$("#logo").innerHTML = [...theme.brand].map((c, i) => c === " " ? `<i class="space"></i>` : `<i${i === 0 ? ' class="letter-first"' : ""}>${c}</i>`).join("")
	$("#logo").setAttribute("href", here === "home.html" ? "#top" : "home.html")
	// nav: four big links, as in the original menu; the page you are on is dimmed
	$("#navigation > div").innerHTML = NAV.map(([n, href], i) => `
		<a data-pos="${i}" class="page-link f-140${href === here ? " active" : ""}" href="${href}" aria-label="${n}"><span>${n}</span><span aria-hidden="true">${n}</span></a>`).join("")
	const studiosEl = $('[data-include="studios"]'), contactEl = $('[data-include="contact"]')
	if (studiosEl) studiosEl.innerHTML = STUDIOS_HTML
	if (contactEl) contactEl.innerHTML = CONTACT_HTML(here === "contact.html" ? "mailto:studio@blackpoint.studio" : "contact.html")
	page.render?.()
}

// FIT DISPLAY TYPE /////////////////////////////////////////////////////////////////////////////////////////
function fitWidth(el, width, basePx = 100) {
	el.style.fontSize = basePx + "px"
	const w = el.scrollWidth
	el.style.fontSize = (basePx * width / w) + "px"
}
const u = () => sizeUnit // one Figma pixel of the reference frame (SIZE UNIT, top of this file)
// the width between the page margins (--gutter in css/home.css, the same formula)
const measure = () => {
	const W = window.innerWidth, margin = Math.min(32, Math.max(16, W / 45))
	return W - 2 * Math.max(margin, Math.min(W * 64 / 1440, W * 0.07 - 36.8))
}

function fitAll() {
	page.fit?.()
	const cta = $(".cta span"), disc = $(".cta-disc")
	if (!cta) return
	if (isSmall()) {
		// on a phone the word and its button share one line: the disc stands as tall as the letters
		const GAP = 12, DISC = 0.74
		cta.style.fontSize = "100px"
		const size = (measure() - GAP) / (cta.scrollWidth / 100 + DISC)
		cta.style.fontSize = size + "px"
		disc.style.width = size * DISC + "px"
	} else {
		// the word fills the row beside the disc; the gap opens from the phone's 12 at 768 to 72 at 1440, where the word is 1080 wide
		disc.style.width = ""
		fitWidth(cta, measure() - disc.offsetWidth - Math.min(72 * u(), 12 + (window.innerWidth - 768) * 60 / 672))
	}
	$(".cta span:nth-of-type(2)").style.fontSize = cta.style.fontSize
}


// LOCAL TIME — Lisbon and Warsaw, ticking ////////////////////////////////////////////////////////////////////
let clockTimer = null
function clocks() {
	const fmt = tz => new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date())
	const tick = () => {
		$$(".local-time b").forEach(b => { b.textContent = fmt(b.dataset.tz) })
	}
	tick()
	clearInterval(clockTimer)
	clockTimer = setInterval(tick, 15000)
}

// PAGE ///////////////////////////////////////////////////////////////////////////////////////////////////
let page = {}, ctx = null, smoother = null
let touchScroll = null // the script that scrolls the page on touch screens (init), not the one inside ScrollSmoother
// how the page glides on after the finger lifts, to compare on a phone (13.11.2026): ?scroll=a | b | c in the address,
// remembered for the tab, so every page then scrolls the same way. momentum: seconds the glide lasts (its length
// grows with it); c is the browser's own scrolling, without the script
const TOUCH_FEEL = { a: { momentum: 2.8 }, b: { momentum: 1.2 }, c: null }
const touchFeel = () => {
	let v = new URLSearchParams(location.search).get("scroll")
	try { if (v in TOUCH_FEEL) sessionStorage.setItem("bp-scroll", v); else v = sessionStorage.getItem("bp-scroll") } catch (e) {}
	return v in TOUCH_FEEL ? v : "b" // b chosen by the user on the phone, 13.11.2026
}

function scrollToTarget(target) {
	if (page.scrollTo && page.scrollTo(target)) return
	if (target === "top") return smoother ? smoother.scrollTo(0, true) : window.scrollTo({ top: 0, behavior: "smooth" })
	const el = typeof target === "string" ? document.getElementById(target) : target
	if (!el) return
	if (smoother) smoother.scrollTo(el, true, "top top")
	else el.scrollIntoView({ behavior: "smooth" })
}

// a link on any page: scroll to a section here, or leave through the page transition
function follow(a, e) {
	const href = a.getAttribute("href")
	if (/^(mailto|tel|https?):/.test(href) || a.target === "_blank") return
	e.preventDefault()
	const id = localTarget(href)
	id ? scrollToTarget(id) : leaveTo(a.href)
}

// rebuilt: the page is built again after a window change. Until the page has settled at its old place (ctx.settling)
// entrances take no time: dur() gives 0, so what you already saw is simply there
function init(rebuilt = false) {
	ctx = { splits: [], abort: new AbortController(), rebuilt, settling: rebuilt }
	const signal = ctx.abort.signal
	setUnit()
	rootTag.classList.toggle("mobile", isMobile() || window.innerWidth < 1024)
	wrapperTag.scrollTop = 0
	fitAll()

	if (!isMobile() && window.innerWidth > 768) {
		smoother = ScrollSmoother.create({ wrapper: "#smooth-wrapper", content: "#smooth-content", smooth: 1, effects: true, normalizeScroll: true })
	}
	// touch screens (13.11.2026, as in Hvera): the page scrolls by the script, not by the browser. Measured on a phone:
	// with the browser's own scrolling a pinned scene comes in 11–71 px too far and springs back, and the address bar
	// changes the window's height. The cost: the address bar stays in view. Full-screen scenes use svh to match
	const feel = TOUCH_FEEL[touchFeel()]
	if (!smoother && feel && ScrollTrigger.isTouch === 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
		// allowNestedScroll: a row that swipes sideways keeps its own scrolling
		touchScroll = ScrollTrigger.normalizeScroll({ allowNestedScroll: true, momentum: feel.momentum })
	}
	bodyTag.classList.remove("loading")
	gsap.to(contentTag, { opacity: 1, duration: 0.5, ease: "power3.inOut" })

	const split = (target, vars) => { const s = new SplitText(target, vars); ctx.splits.push(s); return s }

	page.init?.(split, signal)
	studios(split)
	inView()
	ctaHover(split, signal)
	logoHide()
	menu(signal)
	clocks()

	$$("#logo, .to-top, .cta, .cta-disc").forEach(a => a.addEventListener("click", e => follow(a, e), { signal }))
	ScrollTrigger.refresh()
}

// remembers the place on the page and returns a function that goes back to it after the layout is re-measured:
// inside a pinned scene the same moment of the scene, elsewhere the same point of the same section
const dur = s => ctx && ctx.settling ? 0 : s // an entrance's duration or delay: 0 while a rebuilt page settles
const getScroll = () => smoother ? smoother.scrollTop() : window.scrollY
const setScroll = y => {
	y = Math.max(0, Math.min(y, ScrollTrigger.maxScroll(window))) // never past the end of the page
	smoother ? smoother.scrollTop(y) : window.scrollTo(0, y)
	ScrollTrigger.update()
}
function keepPlace() {
	if (getScroll() >= ScrollTrigger.maxScroll(window) - 2) return () => setScroll(Infinity) // at the very end: stay at the end
	// measured where you see it (smooth scrolling's effects move sections off their layout place); the screen follows
	// a scroll one frame later, so settleAt() repeats this for a few frames until it holds
	const docTop = e => e.getBoundingClientRect().top - contentTag.getBoundingClientRect().top
	// a scene pinned in one layout only (13.11.2026, as in bez-odswiezania/okno.js; the profile pins its row of work on a
	// computer, not on a phone): without its pin in the new layout, go to the same share of the section
	const share = (trigger, p) => trigger.isConnected && setScroll(docTop(trigger) + p * Math.max(0, trigger.offsetHeight - window.innerHeight))
	const pin = ScrollTrigger.getAll().find(s => s.pin && s.isActive)
	if (pin) {
		const trigger = pin.trigger, p = pin.progress
		return () => { const st = ScrollTrigger.getAll().find(s => s.pin && s.trigger === trigger); if (st) setScroll(st.start + p * (st.end - st.start)); else share(trigger, p) }
	}
	// a section of the page: layers fixed to the screen or laid over the page (an open project) do not move with it
	const inFlow = c => !["fixed", "absolute"].includes(getComputedStyle(c).position) && getComputedStyle(c).display !== "none"
	const el = [...contentTag.children].find(c => { const r = c.getBoundingClientRect(); return inFlow(c) && r.height > 0 && r.bottom > 0 })
	if (!el) return null
	// just past a pinned scene, its spacer is still on screen: keep the same distance past the scene's end
	// (the spacer itself is made anew by the rebuild, so it cannot be the anchor)
	if (el.classList.contains("pin-spacer")) {
		const st = ScrollTrigger.getAll().find(s => s.pin && s.pin.parentNode === el)
		if (st) {
			const trigger = st.trigger, past = getScroll() - st.end
			// exactly at the scene's first pixel the spacer is on top too, but the scene has not run yet: keep its progress
			// (12.11.2026: before, the page jumped back by the scene's length, to the top of the profile)
			const p = past < 0 && st.end > st.start ? Math.max(0, (getScroll() - st.start) / (st.end - st.start)) : null
			return () => {
				const n = ScrollTrigger.getAll().find(s => s.pin && s.trigger === trigger)
				if (n) setScroll(p === null ? n.end + past : n.start + p * (n.end - n.start))
				else if (p !== null) share(trigger, p)
				else if (trigger.isConnected) setScroll(docTop(trigger) + trigger.offsetHeight + past)
			}
		}
	}
	const frac = el.offsetHeight ? (getScroll() - docTop(el)) / el.offsetHeight : 0
	return () => {
		// the section may be pinned in the new layout, where its place moves with the pin: go to the same share of its scene
		const st = ScrollTrigger.getAll().find(s => s.pin && (s.trigger === el || s.pin === el))
		if (st) return setScroll(st.start + Math.min(Math.max(frac, 0), 1) * (st.end - st.start))
		const y = docTop(el) + frac * el.offsetHeight; if (Math.abs(y - getScroll()) > 0.5) setScroll(y)
	}
}

// goes back to the remembered place, and keeps it for a moment while the page still settles: pictures that set the
// layout once decoded, the document's new length that the browser takes a little later. It lets go at once when you
// scroll, touch or press a key, so it never works against you; after that, entrances animate as usual
function settleAt(back) {
	let on = true
	const quit = () => { on = false }, inputs = ["wheel", "touchstart", "keydown", "mousedown"]
	inputs.forEach(e => window.addEventListener(e, quit, { passive: true, once: true }))
	const hold = () => { if (on && ctx && ctx.settling) back() }
	const tick = () => { hold(); if (on && ctx && ctx.settling) requestAnimationFrame(tick) }
	tick()
	ScrollTrigger.addEventListener("refresh", hold)
	setTimeout(() => {
		on = false
		inputs.forEach(e => window.removeEventListener(e, quit))
		ScrollTrigger.removeEventListener("refresh", hold)
		if (ctx) ctx.settling = false
	}, 1500)
}

function destroy() {
	if (!ctx) return
	ctx.abort.abort()
	ctx.splits.forEach(s => s.revert())
	gsap.killTweensOf("*")
	ScrollTrigger.killAll()
	if (smoother) { smoother.kill(); smoother = null }
	if (touchScroll) { ScrollTrigger.normalizeScroll(false); touchScroll = null }
	ctx = null
}

// the page held still under an open menu or project: on touch the script that scrolls the page stops too, as
// overflow: hidden alone does not stop it
function holdScroll(on) {
	if (touchScroll) on ? touchScroll.disable() : touchScroll.enable()
	document.documentElement.style.overflow = on ? "hidden" : ""
}

// STUDIOS — city names rise when the section comes in ////////////////////////////////////////////////////////
function studios(split) {
	if (!$(".city")) return
	const names = split(".city h2", { type: "lines, chars", linesClass: "line", charsClass: "char" })
	gsap.set(names.chars, { transformOrigin: "0% 100%", y: "22%", scaleY: 0.2 })
	ScrollTrigger.batch(names.chars, { start: "top 92%", onEnter: b => gsap.to(b, { y: "0%", scaleY: 1, duration: dur(1), stagger: { amount: dur(0.2) }, ease: customEase }) })
	if (!smoother) return
	$$(".city img").forEach(img => gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: ".h-studios", start: "top bottom", end: "bottom top", scrub: true } }))
}

function inView() {
	const items = $$(".home .view")
	gsap.set(items, { opacity: 0, y: 20 })
	ScrollTrigger.batch(items, { start: "top 95%", onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: dur(1), stagger: dur(0.08), ease: "power4.out" }) })
}

// "Get in touch" letters swap to bronze on hover ////////////////////////////////////////////////////////////
function ctaHover(split, signal) {
	const a = $(".cta")
	if (!a) return
	const cur = split(a.querySelector("span:first-of-type"), { type: "chars" }), nxt = split(a.querySelector("span:nth-of-type(2)"), { type: "chars" })
	fitAll() // re-fit now that the letters are split (no kerning between them)
	gsap.set(cur.chars, { transformOrigin: "0% 100%", yPercent: 22, scaleY: 0.2 })
	ScrollTrigger.create({ trigger: a, start: "top 92%", once: true, onEnter: () => gsap.to(cur.chars, { yPercent: 0, scaleY: 1, duration: 1, stagger: { amount: 0.2 }, ease: customEase }) })
	gsap.set(nxt.chars, { yPercent: 22, scaleY: 0.2, transformOrigin: "bottom left" })
	if (!isDesktop()) return gsap.set(nxt.chars, { opacity: 0 })
	a.addEventListener("mouseenter", () => {
		// the white letters fold up against the top edge and out of the clipped box; the entrance above grew
		// them from the baseline, so the origin has to move first or a white strip stays across the word
		gsap.set(cur.chars, { transformOrigin: "0% 0%" })
		gsap.to(cur.chars, { yPercent: -22, scaleY: 0.2, stagger: { amount: 0.15 }, duration: 0.6, ease: "power3", overwrite: true })
		gsap.to(nxt.chars, { yPercent: 0, scaleY: 1, stagger: { amount: 0.15 }, duration: 0.6, ease: "power3", overwrite: true })
	}, { signal })
	a.addEventListener("mouseleave", () => {
		gsap.to(cur.chars, { yPercent: 0, scaleY: 1, stagger: { amount: 0.15 }, duration: 0.6, ease: "power3", overwrite: true })
		gsap.to(nxt.chars, { yPercent: 22, scaleY: 0.2, stagger: { amount: 0.15 }, duration: 0.6, ease: "power3", overwrite: true })
	}, { signal })
}

// LOGO — folds to "B" on the very first scroll, before anything can slide under it //////////////////////////////
function logoHide() {
	const tl = gsap.timeline({ scrollTrigger: { trigger: contentTag, start: "top -=8", toggleActions: "play none none reverse" } })
	tl.to("#logo .letter-first", { transformOrigin: "center left", scale: 2, duration: 0.4, ease: "power4.inOut" })
	tl.to("#logo i:not(.letter-first)", { xPercent: -50, scale: 0, transformOrigin: "center left", duration: 0.4, stagger: { amount: 0.1 }, ease: "power4.inOut" }, "<")
}

// MENU — same choreography as the listing page; links scroll here or go to another page //////////////////////
function menu(signal) {
	const navBg = $("#nav-bg"), hamburger = $("#hamburger"), icon = $("#hamburger i"), navigation = $("#navigation"),
		overlay = $("#pageOverlay"), label = $("#hamburger span span"), links = $$("#navigation a")
	gsap.set(links, { yPercent: 30, opacity: 0 })
	const tl = gsap.timeline({ paused: true }), desktop = isDesktop()
	tl.to(overlay, { opacity: 0.6, pointerEvents: "auto", duration: 1, ease: customEase })
	tl.to(icon, { scale: desktop ? 1.3 : 1, rotate: 90, duration: 1, ease: customEase }, "<")
	tl.to(navBg, { width: desktop ? navigation.offsetWidth : window.innerWidth, height: navigation.offsetHeight, top: 0, right: 0, borderRadius: 0, duration: 1, ease: customEase }, "<")
	if (!desktop) tl.to(label, { y: "0%", duration: 1, ease: customEase }, "<")
	tl.to(links, { yPercent: 0, opacity: 1, duration: 0.35, stagger: { amount: 0.1 }, ease: customEase }, "-=.45")

	let open = false
	// on touch the page stands still while the menu is open (13.11.2026, as in Hvera); with the mouse nothing changes:
	// there the page keeps its scrollbar, so it does not widen under the menu
	const touch = !!touchScroll
	const show = () => { open = true; hamburger.classList.add("opened"); tl.restart().timeScale(1); navigation.style.pointerEvents = "auto"; if (touch) holdScroll(true) }
	const hide = () => { open = false; hamburger.classList.remove("opened"); tl.reverse().timeScale(-2); navigation.style.pointerEvents = "none"; if (touch) holdScroll(false) }
	signal.addEventListener("abort", () => { if (open && touch) holdScroll(false) })
	if (desktop) {
		hamburger.addEventListener("mouseenter", show, { signal })
		navigation.addEventListener("mouseleave", hide, { signal })
		links.forEach(link => {
			const cur = new SplitText(link.querySelector("span:first-of-type"), { type: "chars" }), nxt = new SplitText(link.querySelector("span:nth-of-type(2)"), { type: "chars" })
			ctx.splits.push(cur, nxt)
			gsap.set(cur.chars, { transformOrigin: "top right" })
			gsap.set(nxt.chars, { scaleY: 0.1, yPercent: 20, transformOrigin: "bottom left" })
			link.addEventListener("mouseenter", () => {
				gsap.to(cur.chars, { scaleY: 0.1, yPercent: -25, duration: 0.4, stagger: { amount: 0.15, from: "end" }, ease: "power3" })
				gsap.to(nxt.chars, { scaleY: 1, yPercent: 0, duration: 0.4, stagger: { amount: 0.15, from: "end" }, ease: "power3" })
			}, { signal })
			link.addEventListener("mouseleave", () => {
				gsap.to(cur.chars, { scaleY: 1, yPercent: 0, duration: 0.4, stagger: { amount: 0.15, from: "end" }, ease: "power3" })
				gsap.to(nxt.chars, { scaleY: 0.1, yPercent: 20, duration: 0.4, stagger: { amount: 0.15, from: "end" }, ease: "power3" })
			}, { signal })
		})
	} else {
		hamburger.addEventListener("click", () => (open ? hide() : show()), { signal })
	}
	links.forEach(a => a.addEventListener("click", e => {
		e.preventDefault()
		hide()
		const id = localTarget(a.getAttribute("href"))
		id ? setTimeout(() => scrollToTarget(id), 350) : leaveTo(a.href)
	}, { signal }))
}

// LEAVE — the accent / dark sheets swing in, then the next page loads ////////////////////////////////////////
function leaveTo(href) {
	const wrap = $("#page-to-page"), red = wrap.querySelector(".red-bg"), grey = wrap.querySelector(".grey-bg")
	wrapperTag.style.pointerEvents = "none"
	gsap.set([red, grey], { x: 0, y: 0, yPercent: -100, rotate: -45 })
	wrap.style.opacity = "1"
	const tl = gsap.timeline({ onComplete: () => { location.href = href } })
	tl.to(red, { yPercent: 0, rotate: 0, duration: 1.2, ease: customEase })
	tl.to(grey, { yPercent: 0, rotate: 0, duration: 1.2, ease: customEase }, "-=1.05")
}

// BOOT //////////////////////////////////////////////////////////////////////////////////////////////////////
function boot(p) {
	page = p
	rootTag.classList.replace("no-js", "js")
	// a #hash in the URL makes the browser scroll the fixed wrapper itself; ScrollSmoother must own scrolling,
	// so the hash is taken out of the URL before the browser can jump to it, and replayed after init
	const startHash = location.hash.slice(1)
	if (startHash) history.replaceState(null, "", location.pathname + location.search)
	history.scrollRestoration = "manual"
	wrapperTag.addEventListener("scroll", () => { if (smoother) wrapperTag.scrollTop = 0 })
	render()
	Promise.all([
		document.fonts.load('900 100px "Anybody"'),
		document.fonts.load('700 100px "Anybody"'),
		document.fonts.load('800 30px "Archivo"'),
		document.fonts.load('400 16px "Instrument Sans"'),
		document.fonts.load('600 16px "Instrument Sans"')
	]).catch(() => {}).finally(() => {
		init()
		if (startHash && document.getElementById(startHash)) setTimeout(() => scrollToTarget(startHash), 300)
	})

	// WINDOW CHANGES. After any change of the window's width or height the page is built again, as on a reload, but you
	// stay where you were and the entrances show their end state instead of playing again (ctx.settling, dur()).
	// It works on every page with no preparation, as everything is measured from scratch. Phones skip height-only
	// changes: the address bar resizes the window while you scroll
	// the place is remembered whenever scrolling stops, in the layout you are looking at: by the time the browser reports
	// a window change, the CSS has already laid the page out for the new size
	let lastW = window.innerWidth, lastH = window.innerHeight, resizeTimer = null, back = null, place = null, scrollTimer
	const remember = () => { if (resizeTimer === null) place = keepPlace() }
	window.addEventListener("scroll", () => { clearTimeout(scrollTimer); scrollTimer = setTimeout(remember, 120) }, { passive: true })
	setTimeout(remember, 1000)
	window.addEventListener("resize", () => {
		if (resizeTimer === null) back = place
		clearTimeout(resizeTimer)
		resizeTimer = setTimeout(() => {
			resizeTimer = null
			const w = window.innerWidth, h = window.innerHeight
			if (w === lastW && (h === lastH || isMobile())) return
			lastW = w; lastH = h
			destroy()
			render() // the page's content is made again too, as on a reload: some of it depends on the window (Studio's values rows)
			init(true)
			if (back) settleAt(back)
			setTimeout(remember, 1600) // the place in the new layout, for the next change
		}, 200)
	})
	window.addEventListener("pageshow", e => { if (e.persisted) { $("#page-to-page").style.opacity = "0"; wrapperTag.style.pointerEvents = "auto" } })
}
