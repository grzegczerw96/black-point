// BLACK POINT — PROFILE. One photographer: profile.html?p=first-last. The shared chrome and the page lifecycle live in
// site.js (boot, the size unit, the rebuild after a window change); this file is the page itself. The motion is the one
// the profile had in index.html (js/app.js): the name rises, the card turns in, the backdrop clears from a blur; the card
// tilts the other way as the hero leaves; the row of work moves sideways while its section is pinned (touch screens
// swipe it); "next photographer" swings the sheets in and the next person's page grows out of them, without a reload.

// CONTENT /////////////////////////////////////////////////////////////////////////////////////////////////
const ROSTER = theme.roster
const personFromUrl = () => {
	const i = ROSTER.findIndex(n => slug(n) === new URLSearchParams(location.search).get("p"))
	return i > -1 ? i : 0
}
let person = personFromUrl() // the open profile: it stays through a window change
let busy = false
let swipeAt = 0 // where the swiped row stood (0–1), so a window change keeps it
const arrowSvg = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>`

// THE LAYOUT, from the window's shape (data-mode on #smooth-content, css/profile.css):
//   low   — a window wider than tall with less than 640 of height (laptops, phones sideways)
//   phone — narrower than 600
//   tall  — an upright tablet (narrower than 1.1 × its height)
//   desk  — the rest
const pfMode = (W = innerWidth, H = innerHeight) => (H < 640 && W > H ? "low" : W < 600 ? "phone" : W / H < 1.1 ? "tall" : "desk")
// the bottom of the menu: what stands still on the page stands below it
const menuBottom = () => { const m = $("#hamburger"); return m.offsetTop + m.offsetHeight }

// the widest line of a block of text at 100px, in px (lines split by <br>)
function widestAt100(el) {
	const probe = document.createElement("span")
	probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font-size:100px;"
	el.appendChild(probe)
	const w = Math.max(...el.innerHTML.split(/<br\s*\/?>/i).map(t => { probe.textContent = t.replace(/<[^>]+>/g, ""); return probe.offsetWidth }))
	probe.remove()
	return w
}

// SIZES THAT ARE FITTED, NOT TAKEN FROM THE SCALE ////////////////////////////////////////////////////////////////
function fitProfile() {
	const W = innerWidth, H = innerHeight, top = menuBottom()
	// the name: 288 at 1440 × 900 (the size unit), 26% of the width on phones; never wider than the page margins allow,
	// and its two lines never fill more than 62% of the room below the menu, so the card keeps its place above it
	const name = $(".pf-name")
	const cap = Math.max(288 * u(), Math.min(0.26 * W, 97.6))
	name.style.fontSize = Math.min(cap, measure() * 100 / widestAt100(name), (H - top) * 0.62 / (2 * 0.82)) + "px"

	// the next person: 172.8 at 1440 (12vw), 15% of the width on phones; the name fills the row beside the disc at most
	const next = $(".pf-next h2 span"), disc = $(".pf-disc")
	const nextCap = Math.max(172.8 * u(), Math.min(0.15 * W, 56))
	const room = measure() - disc.offsetWidth - parseFloat(getComputedStyle($(".pf-next")).columnGap)
	next.style.fontSize = Math.min(nextCap, room * 100 / widestAt100(next)) + "px"
	$(".pf-next h2 span:nth-of-type(2)").style.fontSize = next.style.fontSize

	// the pinned row of work: the whole section (title, row, captions) fits between the menu and its mirror below
	const work = $("#work"), gallery = $(".pf-gallery")
	gallery.style.removeProperty("--pf-row-fit")
	if (work.classList.contains("is-pinned")) {
		const fig = $(".pf-track figure"), gap = parseFloat(getComputedStyle(work).rowGap),
			caps = Math.max(...$$(".pf-cap").map(c => c.offsetHeight)),
			rest = $(".pf-work-head").offsetHeight + gap + parseFloat(getComputedStyle($(".pf-track li")).rowGap) + caps
		const room = H - 2 * (top + 16) - rest
		if (room < fig.offsetHeight) gallery.style.setProperty("--pf-row-fit", Math.max(120, room) + "px")
	}
}

// THE PAGE /////////////////////////////////////////////////////////////////////////////////////////////////////
function renderProfile() {
	const pr = profileFor(theme, person), p = theme.profile,
		nextIndex = (person + 1) % ROSTER.length, next = ROSTER[nextIndex], words = pr.name.split(" "),
		cover = imageFor(theme, pr.name), phone = pfMode() === "phone"
	// the sections stay through a rebuild: take #work out of the spacer its pin left around it, with the pin's inline styles
	$$("#smooth-content > .pin-spacer").forEach(sp => { const kid = sp.firstElementChild; kid.style.cssText = ""; sp.replaceWith(kid) })
	document.title = `${pr.name} - Black Point`
	contentTag.dataset.mode = pfMode()
	$(".pf-backdrop").innerHTML = `<img src="${cover}"${photoPos(theme, cover)} alt="">`
	$("#hero").innerHTML = `
			<a href="${p.backHref}" class="pf-back pf-small pf-intro">&larr; ${p.back}</a>
			<div class="pf-card"><figure><img src="${cover}" alt="${pr.name}"></figure></div>
			<h1 class="hero-split chars pf-name">${words[0]}<br>${words.slice(1).join(" ")}</h1>`
	// on a phone About opens with the photographer's portrait, as on Team (stock pictures for now, img/portraits/CREDITS.md)
	$("#bio").innerHTML = `${phone ? `
			<figure class="pf-portrait pf-in"><img src="img/portraits/${slug(pr.name)}.jpg" alt="${pr.name}"></figure>` : ""}
			<span class="pf-label pf-small pf-in">About</span>
			<div class="pf-about">
				<p class="pf-text">${pr.bio}</p>
				<dl class="pf-facts pf-small">
					<div class="pf-in"><dt>Based in</dt><dd>${pr.city}</dd></div>
					<div class="pf-in"><dt>Focus</dt><dd>${pr.focus.join(", ")}</dd></div>
					<div class="pf-in"><dt>Clients</dt><dd>${pr.clients.join(", ")}</dd></div>
				</dl>
			</div>`
	$("#work").innerHTML = `
			<div class="pf-work-head">
				<h2 class="split chars pf-work-title">${p.work}</h2>
				<span class="pf-small pf-in">(${pad(pr.work.length)})</span>
			</div>
			<div class="pf-gallery">
				<ul class="pf-track">${pr.work.map((w, k) => {
					const src = galleryImage(theme, pr.name, k), what = w.title ? `${w.client} &mdash; ${w.title}` : w.client
					return `
					<li class="${w.landscape ? "land" : "port"}">
						<figure><img src="${src}"${photoPos(theme, src)} alt="${w.title ? `${w.client} — ${w.title}` : w.client}" draggable="false"></figure>
						<p class="pf-cap"><span>${pad(k + 1)}</span><span>${what}</span><span>${w.year}</span></p>
					</li>`
				}).join("")}
				</ul>
			</div>`
	$("#next").innerHTML = `
			<div class="pf-next-group">
				<span class="pf-small pf-in">${p.next}</span>
				<a href="profile.html?p=${slug(next)}" class="pf-next" data-index="${nextIndex}" aria-label="${next}">
					<h2 class="double-hover"><span>${next}</span><span aria-hidden="true">${next}</span></h2>
					<i class="pf-disc">${arrowSvg}</i>
				</a>
			</div>
			<footer class="pf-foot">
				<a href="${p.backHref}" class="pf-home">&larr; ${p.back}</a>
				<span>${titleCaseBrand()} &copy; 2026</span>
			</footer>`
	// a phone shows the work in a column; other touch screens swipe the row; pointer screens get the pinned section
	// (its layout is part of the fit)
	$(".pf-gallery").classList.toggle("swipe", isMobile() && !phone)
	$("#work").classList.toggle("is-pinned", !isMobile() && !phone)
}
const titleCaseBrand = () => theme.brand.toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase())

// THE PHONE HERO (chosen by the user 12.11.2026 in Figma, "Hero B"): a larger card and the name as one group in the middle
// of the room under "← Home"; the first line of the name lies on the foot of the card, in front of it
function phoneHero() {
	const back = $(".pf-back"), card = $(".pf-card"), name = $(".pf-name"), W = innerWidth
	const gap = Math.max(16, 32 * u()) // --gap-tight
	const top = back.offsetTop + back.offsetHeight + gap, room = $("#hero").offsetHeight - top
	const nameH = name.offsetHeight, over = name.querySelector(".line").offsetHeight // the first line
	const w = Math.min(0.8 * W, 300, (room - 2 * gap - (nameH - over)) * 0.75), h = w * 4 / 3
	const y = top + (room - (h + nameH - over)) / 2
	card.style.width = w + "px"
	card.style.top = y + h / 2 + "px"
	name.style.top = y + h - over + "px"
	name.style.bottom = "auto"
}

// THE MOTION ///////////////////////////////////////////////////////////////////////////////////////////////////
function hero(split, fresh) {
	const img = $(".pf-backdrop img"), turned = pfMode() === "phone" ? -4 : -7
	gsap.set(img, { opacity: 0, filter: "blur(15px)" })
	gsap.to(img, { opacity: 0.4, filter: "blur(0px)", duration: dur(1.2), ease: "power2" })

	const name = split(".pf-name", { type: "lines, chars", linesClass: "line", charsClass: "char" })
	// split letters lose their kerning, so the name grows a little: fit it again to the page margins
	const span = l => { const c = $$(".char", l); return c.length ? c[c.length - 1].getBoundingClientRect().right - c[0].getBoundingClientRect().left : 0 }
	const wide = Math.max(...name.lines.map(span))
	if (wide > measure()) $(".pf-name").style.fontSize = parseFloat($(".pf-name").style.fontSize) * measure() / wide + "px"
	if (pfMode() === "phone") phoneHero()
	gsap.set(name.chars, { transformOrigin: "top left", y: "-30%", scaleY: 0 })
	gsap.set(".pf-card figure", { rotate: -15, scale: 0.8, opacity: 0 })
	gsap.set(".pf-intro", { opacity: 0 })
	if (smoother && fresh) smoother.paused(true) // the visitor waits for the entrance, as before

	const tl = gsap.timeline()
	tl.to(name.chars, { duration: dur(1.5), stagger: { amount: dur(0.2) }, scaleY: 1, y: 0, ease: customEase })
	tl.to(".pf-card figure", { rotate: turned, scale: 1, opacity: 1, duration: dur(1), ease: "power4" }, "-=" + dur(0.8))
	tl.to(".pf-intro", {
		opacity: 1, duration: dur(0.75), stagger: { amount: dur(0.2) }, ease: "power4",
		onComplete: () => {
			if (smoother) smoother.paused(false)
			// the card tilts the other way as the hero scrolls out; it does not drift, or the hero's edge would cut it
			gsap.to(".pf-card figure", { rotate: 10, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } })
			gsap.fromTo(img, { opacity: 0.4 }, { opacity: 0.1, ease: "none", immediateRender: false, scrollTrigger: { trigger: "#bio", start: "top bottom", end: "top 30%", scrub: true } })
		}
	}, "-=" + dur(1))
}

// scroll-in text: chars rise from a squashed baseline, lines slide up; small things fade in
function textIn(split) {
	const chars = split("#smooth-content .split.chars", { type: "lines, chars", linesClass: "line", charsClass: "char" }),
		lines = split(".pf-text", { type: "lines", linesClass: "line" })
	gsap.set(chars.chars, { transformOrigin: "0% 100%", y: "22%", scaleY: 0.2 })
	ScrollTrigger.batch(chars.chars, { start: "top 95%", onEnter: b => gsap.to(b, { duration: dur(1), stagger: { amount: dur(0.2) }, y: "0%", scaleY: 1, ease: customEase }) })
	gsap.set(lines.lines, { opacity: 0, y: "150%" })
	ScrollTrigger.batch(lines.lines, {
		start: "top 95%",
		onEnter: b => gsap.to(b, { opacity: 1, duration: dur(1), y: 0, stagger: dur(0.03), ease: "expo.out" }),
		onLeaveBack: b => gsap.to(b, { opacity: 0, y: "150%", stagger: 0.03, ease: "power4" })
	})
	const items = $$(".pf-in")
	gsap.set(items, { opacity: 0 })
	ScrollTrigger.batch(items, { start: "top 95%", onEnter: b => gsap.to(b, { opacity: 1, duration: dur(1), stagger: { amount: dur(0.2) }, ease: "power4.out" }) })
}

// THE ROW OF WORK — the section is pinned while scrolling moves the row sideways, one pixel across per pixel down.
// A touch screen swipes the row instead: pinning under a finger is restless
function gallery(signal) {
	const wrap = $(".pf-gallery"), track = $(".pf-track"), travel = () => Math.max(0, track.scrollWidth - wrap.clientWidth)
	if (!wrap.classList.contains("swipe") && !$("#work").classList.contains("is-pinned")) return // a phone: the column scrolls with the page
	if (wrap.classList.contains("swipe")) {
		if (ctx.rebuilt) wrap.scrollLeft = swipeAt * travel()
		wrap.addEventListener("scroll", () => { swipeAt = travel() ? wrap.scrollLeft / travel() : 0 }, { passive: true, signal })
		return
	}
	gsap.to(track, { x: () => -travel(), ease: "none", scrollTrigger: { trigger: "#work", start: "top top", end: () => "+=" + travel(), pin: true, scrub: true, invalidateOnRefresh: true } })
}

// letters swap to the bronze copy on hover; no cursor, no second copy. The white letters fold up out of the box
// (-30%: at -22% their squashed feet stayed in it as a white strip above the bronze name)
function doubleHover(split, signal) {
	if (!isDesktop()) return gsap.set("#smooth-content .double-hover span:nth-of-type(2)", { display: "none" })
	$$("#smooth-content .double-hover").forEach(dh => {
		const host = dh.closest("a") || dh,
			cur = split(dh.querySelector("span:first-of-type"), { type: "chars" }),
			nxt = split(dh.querySelector("span:nth-of-type(2)"), { type: "chars" })
		gsap.set(nxt.chars, { yPercent: 22, scaleY: 0.2, transformOrigin: "bottom left" })
		gsap.set(cur.chars, { transformOrigin: "top left" })
		host.addEventListener("mouseenter", () => {
			gsap.to(cur.chars, { yPercent: -30, scaleY: 0.2, stagger: { amount: 0.1 }, duration: 0.6, ease: "power3" })
			gsap.to(nxt.chars, { yPercent: 0, scaleY: 1, stagger: { amount: 0.1 }, duration: 0.6, ease: "power3" })
		}, { signal })
		host.addEventListener("mouseleave", () => {
			gsap.to(cur.chars, { yPercent: 0, scaleY: 1, stagger: { amount: 0.1 }, duration: 0.6, ease: "power3" })
			gsap.to(nxt.chars, { yPercent: 22, scaleY: 0.2, stagger: { amount: 0.1 }, duration: 0.6, ease: "power3" })
		}, { signal })
	})
}

// NEXT PHOTOGRAPHER — the accent sheet swings down, the dark one follows, the page sinks away; behind the sheets the next
// person's page is built and enters as on arrival. The address changes, so Back returns to the previous person
function goTo(i, push) {
	if (busy || i === person) return
	busy = true
	wrapperTag.style.pointerEvents = "none"
	const wrap = $("#page-to-page"), red = $(".red-bg", wrap), grey = $(".grey-bg", wrap)
	gsap.set([red, grey], { x: 0, y: 0, yPercent: -100, rotate: -45 })
	const tl = gsap.timeline()
	tl.to(red, { yPercent: 0, rotate: 0, duration: 1.5, ease: customEase, onStart: () => { wrap.style.opacity = "1" } })
	tl.to(grey, { yPercent: 0, rotate: 0, duration: 1.5, ease: customEase }, "-=1.35")
	// the page sinks as one: every section by the same 35% of the screen (35% of its own height let a tall section, the
	// phone's column of work, run over the one below)
	gsap.to("#smooth-content > *", { transformOrigin: "top left", y: innerHeight * 0.35, opacity: 0, duration: 1.5, ease: customEase })
	gsap.to("#logo .letter-first", { transformOrigin: "center left", scale: 1, duration: 0.4, ease: "power4.inOut" })
	gsap.to("#logo i:not(.letter-first)", { xPercent: 0, scale: 1, duration: 0.4, stagger: { amount: 0.1, from: "start" }, ease: "power4.inOut" })
	setTimeout(() => {
		person = i
		swipeAt = 0
		if (push) { const url = new URL(location.href); url.searchParams.set("p", slug(ROSTER[i])); history.pushState(null, "", url) }
		destroy()
		gsap.set("#smooth-content > *", { clearProps: "transform,opacity" }) // the sections stay: they sank away with the old page
		window.scrollTo(0, 0) // the next person's page starts at the top
		wrap.style.opacity = "0" // the dark sheet covers the screen by now; the new page fades in under it
		render()
		init()
		wrapperTag.style.pointerEvents = "auto"
		busy = false
		window.dispatchEvent(new Event("scroll")) // site.js remembers the place in the new page, for a window change
	}, 1500)
}
window.addEventListener("popstate", () => goTo(personFromUrl(), false))

boot({
	render: renderProfile,
	fit: fitProfile,
	init(split, signal) {
		hero(split, !ctx.rebuilt)
		textIn(split)
		gallery(signal)
		doubleHover(split, signal)
		$$(".pf-back, .pf-home").forEach(a => a.addEventListener("click", e => follow(a, e), { signal }))
		$(".pf-next").addEventListener("click", e => { e.preventDefault(); goTo(Number(e.currentTarget.dataset.index), true) }, { signal })
	}
})
