// themes, slug, imageFor come from js/themes.js (classic scripts, so the page also runs from file://)

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, CustomEase)
gsap.config({ nullTargetWarn: false })

// VARIABLES /////////////////////////////////////////////////////////////////////////////////////////////
const bodyTag = document.body,
	rootTag = document.documentElement,
	logoTag = document.querySelector("#logo"),
	wrapperTag = document.querySelector("#smooth-wrapper"),
	contentTag = document.querySelector("#smooth-content"),
	bgFigure = document.querySelector(".bg-images"),
	navInner = document.querySelector("#navigation > div"),
	switchTag = document.querySelector("#themeSwitch")

const contentTemplate = contentTag.innerHTML

// THE ORIGINAL CUSTOM EASE (slow start, steep middle, long settle)
const customEase = CustomEase.create("custom", "M0,0 C0.25,0 0.288,-0.004 0.404,0.112 0.54,0.248 0.487,0.707 0.594,0.882 0.65,0.974 0.698,1 1,1 ")

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || matchMedia("(hover: none) and (pointer: coarse)").matches
const isDesktop = () => !isMobile() && window.innerWidth > 1024
const isSmall = () => window.innerWidth <= 768

const store = {
	get(k) { try { return localStorage.getItem(k) } catch (e) { return null } },
	set(k, v) { try { localStorage.setItem(k, v) } catch (e) {} }
}

// THEME STATE ///////////////////////////////////////////////////////////////////////////////////////////
function initialTheme() {
	const q = new URLSearchParams(location.search).get("t")
	const fromQuery = themes.findIndex((t, i) => t.id === q || String(i + 1) === q)
	if (fromQuery > -1) return fromQuery
	const saved = themes.findIndex(t => t.id === store.get("theme"))
	return saved > -1 ? saved : 0
}
let current = initialTheme()
let page = null // per-page cleanup handle
let smoother = null
let busy = false

const titleCase = s => s.toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase())

// RENDER ////////////////////////////////////////////////////////////////////////////////////////////////
function applyPalette(theme) {
	const p = theme.palettes ? theme.palettes[paletteIndex(theme)] : theme
	rootTag.style.setProperty("--accent", p.accent)
	rootTag.style.setProperty("--bg", p.bg || "#131212")
	rootTag.style.setProperty("--panel", p.panel || "#2A2929")
	rootTag.style.setProperty("--title", p.titleColor || theme.titleColor || p.accent)
	if (theme.fontBody) rootTag.style.setProperty("--font-body", theme.fontBody)
	else rootTag.style.removeProperty("--font-body")
	const btn = switchTag.querySelector(".palette")
	btn.hidden = !theme.palettes
	if (theme.palettes) btn.textContent = p.name
}
const paletteIndex = theme => {
	const q = new URLSearchParams(location.search).get("p")
	const i = theme.palettes.findIndex(p => p.name.toLowerCase() === (q || store.get("palette-" + theme.id) || "").toLowerCase())
	return i > -1 ? i : 0
}
function nextPalette() {
	const theme = themes[current]
	if (!theme.palettes) return
	const next = theme.palettes[(paletteIndex(theme) + 1) % theme.palettes.length]
	store.set("palette-" + theme.id, next.name)
	const url = new URL(location.href)
	url.searchParams.set("p", next.name.toLowerCase())
	try { history.replaceState(null, "", url) } catch (e) {} // file:// may refuse
	rootTag.classList.add("palette-anim")
	setTimeout(() => rootTag.classList.remove("palette-anim"), 700)
	applyPalette(theme)
}

function render(theme) {
	renderChrome(theme)
	renderList(theme)
}

// everything that survives between pages: palette, logo, nav, background photos, switcher
function renderChrome(theme) {
	applyPalette(theme)
	document.querySelector('meta[name="description"]').content = theme.description

	// LOGO: mark + letters (mark scales up, letters collapse on scroll — like the original "O")
	logoTag.innerHTML = [...theme.brand].map((c, i) => c === " " ? `<i class="space"></i>` : `<i${i === 0 ? ' class="letter-first"' : ""}>${c}</i>`).join("")
	logoTag.setAttribute("aria-label", theme.brand)

	// NAV
	navInner.innerHTML = theme.nav.map((n, i) => `
		<a data-pos="${i}" class="page-link f-140${i === 0 ? " active" : ""}" href="${(theme.navLinks && theme.navLinks[i]) || "#" + slug(n)}" aria-label="${n}">
			<span>${n}</span><span aria-hidden="true">${n}</span>
		</a>`).join("")

	// BACKGROUND IMAGES
	bgFigure.innerHTML = theme.roster.map(n => `
		<div class="img-frame"><img src="${imageFor(theme, n, 1600, 900)}"${photoPos(theme, imageFor(theme, n))} data-page="${slug(n)}" alt=""></div>`).join("")

	// SWITCHER
	switchTag.querySelector(".count").textContent = `${String(themes.indexOf(theme) + 1).padStart(2, "0")}/${themes.length}`
	switchTag.querySelector(".name").textContent = theme.brand
}

// the listing page itself
function renderList(theme) {
	document.title = `${theme.title} - ${titleCase(theme.brand)}`
	contentTag.className = "directors"
	contentTag.innerHTML = contentTemplate
	contentTag.querySelector(".dir-title h1").textContent = theme.title
	contentTag.querySelector(".dir-listing ul").innerHTML = theme.roster.map((n, i) => `
		<li>
			<i></i>
			<h2>
				<a class="f-50" href="#${theme.profile ? "/" : ""}${slug(n)}" data-target="${slug(n)}" data-count="${i + 1}" data-index="${i}">
					<div><img class="lazy" src="${imageFor(theme, n, 72, 45)}" data-src="${imageFor(theme, n, 720, 450)}" alt="${n}"></div>
					<span class="hero-split chars">${n}</span>
					<span class="title-hover" aria-hidden="true">${n}</span>
				</a>
			</h2>
		</li>`).join("")
	contentTag.querySelector(".footer-links").innerHTML = theme.nav.slice(0, 4).map(n => `<a href="#${slug(n)}">${n}</a>`).join("")
	contentTag.querySelector(".brand-copy").textContent = theme.brand
}

// FIT THE GIANT TITLE TO THE 22-COLUMN WIDTH (the original word fills it exactly) ///////////////////////////
function fitTitle() {
	const aside = contentTag.querySelector("aside.dir-title"),
		h1 = aside.querySelector("h1")
	const base = isSmall() ? 28 : 28.7
	h1.style.fontSize = base + "vw"
	aside.style.bottom = ""
	const probe = document.createElement("span")
	probe.textContent = h1.textContent
	probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;letter-spacing:.005em;"
	h1.appendChild(probe)
	const ratio = gsap.utils.clamp(0.45, isSmall() ? 1 : 1.35, aside.offsetWidth / probe.offsetWidth)
	probe.remove()
	h1.style.fontSize = (base * ratio) + "vw"
	if (isSmall()) return

	// sit the baseline just under the bottom edge, like the original (font-metric independent)
	const cs = getComputedStyle(h1),
		px = parseFloat(cs.fontSize),
		lh = parseFloat(cs.lineHeight),
		cv = document.createElement("canvas").getContext("2d")
	cv.font = `${cs.fontWeight} ${px}px ${cs.fontFamily}`
	const m = cv.measureText(h1.textContent),
		belowBaseline = (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxDescent
	// original: baseline floats 0.0843em above the viewport edge (Thunder 413px → 35px)
	aside.style.bottom = -(belowBaseline - px * 0.0843) + "px"
}

// SHRINK THE MENU WORDS ONLY IF THEY WOULD OVERFLOW THE PANEL — WIDTH (longest word) OR HEIGHT (all rows) ////
// Measured at a fixed 100px probe size, so the result never depends on the size currently on screen.
function fitNav() {
	const navigation = document.querySelector("#navigation"),
		links = [...navigation.querySelectorAll("a")],
		cs = getComputedStyle(navigation),
		root = getComputedStyle(rootTag),
		vw = window.innerWidth / 100,
		base = gsap.utils.clamp(40, 180, Math.min(18 * vw, Math.max(100, 9.7222 * vw), (window.innerHeight - 224) / 3)) * parseFloat(root.getPropertyValue("--nav-scale")), // the same rule as #navigation a in style.css
		lh = parseFloat(root.getPropertyValue("--nav-lh")),
		innerW = navigation.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
		innerH = window.innerHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom),
		probe = document.createElement("span")

	probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;display:inline-block;font-size:100px;transition:none;"
	links[0].appendChild(probe)
	const widestAt100 = Math.max(...links.map(a => {
		probe.textContent = a.querySelector("span").textContent
		return probe.offsetWidth
	}))
	probe.remove()

	const byWidth = innerW / (widestAt100 / 100),
		byHeight = innerH / (links.length * lh),
		fit = Math.min(1, (byWidth / base) * 0.985, byHeight / base) // 1.5% slack for sub-pixel rounding
	navigation.style.setProperty("--nav-fit", fit.toFixed(3))
}

// SMOOTH SCROLLING ////////////////////////////////////////////////////////////////////////////////////////
function smoothScroll() {
	if (!isMobile() && window.innerWidth > 768 && !smoother) {
		smoother = ScrollSmoother.create({
			wrapper: "#smooth-wrapper",
			content: "#smooth-content",
			smooth: 1, // seconds to catch up with native scroll
			effects: true,
			normalizeScroll: true
		})
	}
	return smoother
}

// LAZY LOAD — low-res placeholder on top, fades out once the full image is in ////////////////////////////////
function lazyLoad(ctx) {
	gsap.utils.toArray(".lazy").forEach(image => {
		let st
		const newSRC = image.dataset.src,
			newImage = document.createElement("img"),
			loadImage = () => {
				newImage.onload = () => {
					newImage.onload = null
					newImage.src = image.src
					image.src = newSRC
					gsap.set(newImage, { position: "absolute", top: image.offsetTop, left: image.offsetLeft, width: image.offsetWidth, height: image.offsetHeight })
					image.parentNode && image.parentNode.appendChild(newImage)
					gsap.to(newImage, { opacity: 0, duration: 0.35, onComplete: () => newImage.remove() })
					st && st.kill()
				}
				newImage.src = newSRC
			}
		st = ScrollTrigger.create({ trigger: image, start: "top 150%", onEnter: loadImage, onEnterBack: loadImage })
	})
}

// HERO ANIMATION (listing page) ////////////////////////////////////////////////////////////////////////////
function heroAnim(ctx) {
	const heroEl = gsap.utils.toArray(".hero-in")
	gsap.set(heroEl, { opacity: 0 })

	const heroChars = new SplitText(".dir-listing .hero-split.chars", { type: "lines, words, chars", linesClass: "line", wordsClass: "word", charsClass: "char" })
	const heroSide = new SplitText(".dir-title .hero-split.bottom", { type: "lines, chars", linesClass: "line", charsClass: "char" })
	ctx.splits.push(heroChars, heroSide)

	gsap.set(heroChars.chars, { transformOrigin: "top left", y: "-30%", scaleY: 0 })
	gsap.set(heroSide.chars, { transformOrigin: "bottom right", x: window.innerWidth })

	const tl = gsap.timeline()
	tl.to(heroSide.chars, { duration: 1, stagger: { amount: 0.2 }, x: 0, ease: "power4" })
	tl.to(heroChars.chars, { duration: 1, stagger: { amount: 0.2 }, scaleY: 1, y: 0, ease: "power4" }, "-=.7")
	tl.to(heroEl, { opacity: 1, duration: 1, ease: "power4" }, "-=.9")

	if (window.innerWidth < 1024) {
		const list = gsap.utils.toArray(".dir-listing li")
		gsap.set(list, { opacity: 0, yPercent: 50 })
		gsap.to(list, { yPercent: 0, opacity: 1, duration: 0.8, stagger: { each: 0.05 }, ease: "power3.inOut" })
	}
}

// HOVER: title sinks, roster dims, picked name turns accent, background photo un-blurs ///////////////////////
function directorsHover(ctx) {
	if (!isDesktop()) return
	const links = gsap.utils.toArray(".directors li a"),
		listingWrap = document.querySelector(".dir-listing ul"),
		signal = ctx.abort.signal,
		timeout = 600

	ctx.timers.push(setTimeout(() => {
		listingWrap.addEventListener("mouseenter", () => {
			gsap.to("#track i", { scale: 2, duration: 0.4, ease: "power3" })
			gsap.to(".dir-title h1 .char", { yPercent: 60, stagger: { amount: 0.1 }, transformOrigin: "top left", duration: 0.6, ease: "power3" })
		}, { signal })
		listingWrap.addEventListener("mouseleave", () => {
			gsap.to("#track i", { scale: 1, duration: 0.4, ease: "power3" })
			gsap.to(".dir-title h1 .char", { yPercent: 0, stagger: { amount: 0.1 }, transformOrigin: "top left", duration: 0.6, ease: "power3" })
		}, { signal })
	}, timeout))

	links.forEach(li => {
		const hoverSplit = new SplitText(li.querySelector(".title-hover"), { type: "chars", charsClass: "char" })
		ctx.splits.push(hoverSplit)
		gsap.set(hoverSplit.chars, { transformOrigin: "left bottom", scaleY: 0 })

		ctx.timers.push(setTimeout(() => {
			li.addEventListener("mouseenter", () => {
				const thisImage = document.querySelector(`.bg-images [data-page="${li.dataset.target}"]`)
				gsap.to(links, { opacity: 0.2, duration: 0.4, ease: "power4" })
				li.classList.add("active")
				gsap.set(thisImage, { filter: "blur(15px)" })
				gsap.to(thisImage, { opacity: 0.75, duration: 0.4, filter: "blur(0px)", ease: "power2" })
				gsap.to(hoverSplit.chars, { yPercent: 0, scaleY: 1, stagger: { amount: 0.1 }, ease: "expo", duration: 0.5 })
			}, { signal })
			li.addEventListener("mouseleave", () => {
				const thisImage = document.querySelector(`.bg-images [data-page="${li.dataset.target}"]`)
				gsap.to(links, { opacity: 1, duration: 0.4, ease: "power4" })
				li.classList.remove("active")
				gsap.to(thisImage, { opacity: 0, duration: 0.4, filter: "blur(15px)", ease: "power2" })
				gsap.to(hoverSplit.chars, { yPercent: 10, scaleY: 0, stagger: { amount: 0.1 }, ease: "expo", duration: 0.5 })
			}, { signal })
		}, timeout))
	})
}

// RED DOT FOLLOWS THE CURSOR ALONG THE LIST /////////////////////////////////////////////////////////////////
function dotMove(ctx) {
	if (!isDesktop()) return
	const ball = document.querySelector("#track"),
		listingWrap = document.querySelector(".dir-listing"),
		setY = gsap.quickSetter(ball, "y", "px")

	document.addEventListener("mousemove", e => {
		const box = listingWrap.getBoundingClientRect(),
			size = ball.offsetHeight
		setY(gsap.utils.clamp(0, box.height - size, e.clientY - box.top - size / 2))
	}, { signal: ctx.abort.signal })
}

// MOBILE: cards grow from half width as they scroll in ///////////////////////////////////////////////////////
function dirMobile(ctx) {
	if (!isSmall()) return
	gsap.utils.toArray(".dir-listing li").forEach(i => {
		const img = i.querySelector("a > div"),
			title = i.querySelector("a > span")
		gsap.set(img, { width: 10 })
		gsap.set(i, { width: "50%" })
		gsap.set(title, { x: -window.innerWidth / 7, scale: 0.7, transformOrigin: "center left" })

		const tl = gsap.timeline({ scrollTrigger: { trigger: i, start: "bottom bottom", end: "bottom 60%", scrub: true } })
		tl.to(img, { width: (window.innerWidth / 24) * 7, duration: 1, ease: "power1" })
		tl.to(i, { width: "100%", duration: 1, ease: "power1" }, "<")
		tl.to(title, { x: 0, duration: 1, scale: 1, ease: "power1" }, "<")
	})
}

// LOGO COLLAPSES TO ITS MARK ON SCROLL //////////////////////////////////////////////////////////////////////
function logoHide() {
	const letters = gsap.utils.toArray("#logo i:not(.letter-first)")
	const tl = gsap.timeline({ scrollTrigger: { trigger: contentTag, start: "top -=200", toggleActions: "play none none reverse" } })
	tl.to("#logo .letter-first", { transformOrigin: "center left", scale: 2, duration: 0.4, ease: "power4.inOut" })
	tl.to(letters, { xPercent: -50, transformOrigin: "center left", scale: 0, duration: 0.4, stagger: { amount: 0.1, from: "start" }, ease: "power4.inOut" }, "<")
}

// MENU //////////////////////////////////////////////////////////////////////////////////////////////////////
let menuApi = null
function menu() {
	if (menuApi) menuApi.destroy()
	const abort = new AbortController(),
		signal = abort.signal,
		navBg = document.querySelector("#nav-bg"),
		hamburger = document.querySelector("#hamburger"),
		hambLabel = document.querySelector("#hamburger span span"),
		icon = document.querySelector("#hamburger i"),
		navigation = document.querySelector("#navigation"),
		pageOverlay = document.querySelector("#pageOverlay"),
		links = gsap.utils.toArray("#navigation a"),
		splits = []

	fitNav()
	gsap.set(links, { yPercent: 30, opacity: 0 })
	const tl = gsap.timeline({ paused: true })

	const open = () => {
		hamburger.classList.add("opened")
		tl.restart().timeScale(1)
		navigation.style.pointerEvents = "auto"
	}
	const close = speed => {
		hamburger.classList.remove("opened")
		tl.reverse().timeScale(-speed)
		navigation.style.pointerEvents = "none"
	}

	if (isDesktop()) {
		tl.to(pageOverlay, { opacity: 0.6, pointerEvents: "auto", duration: 1, ease: customEase })
		tl.to(icon, { scale: 1.3, rotate: 90, duration: 1, ease: customEase }, "<")
		tl.to(navBg, { width: navigation.offsetWidth, height: navigation.offsetHeight, top: 0, right: 0, borderRadius: 0, duration: 1, ease: customEase }, "<")
		tl.to(links, { yPercent: 0, opacity: 1, duration: 0.35, stagger: { amount: 0.1, from: "start" }, ease: customEase }, "-=.45")

		hamburger.addEventListener("mouseenter", open, { signal })
		navigation.addEventListener("mouseleave", () => close(2), { signal })

		links.forEach(link => {
			const splitCur = new SplitText(link.querySelector("span:first-of-type"), { type: "chars" }),
				splitNew = new SplitText(link.querySelector("span:nth-of-type(2)"), { type: "chars" })
			splits.push(splitCur, splitNew)
			gsap.set(splitCur.chars, { transformOrigin: "top right" })
			gsap.set(splitNew.chars, { scaleY: 0.1, yPercent: 20, transformOrigin: "bottom left" })

			link.addEventListener("mouseenter", () => {
				gsap.to(splitCur.chars, { scaleY: 0.1, yPercent: -25, duration: 0.4, stagger: { amount: 0.15, from: "end" }, ease: "power3" })
				gsap.to(splitNew.chars, { scaleY: 1, yPercent: 0, duration: 0.4, stagger: { amount: 0.15, from: "end" }, ease: "power3" })
			}, { signal })
			link.addEventListener("mouseleave", () => {
				gsap.to(splitCur.chars, { scaleY: 1, yPercent: 0, duration: 0.4, stagger: { amount: 0.15, from: "end" }, ease: "power3" })
				gsap.to(splitNew.chars, { scaleY: 0.1, yPercent: 20, duration: 0.4, stagger: { amount: 0.15, from: "end" }, ease: "power3" })
			}, { signal })
			link.addEventListener("click", () => close(2), { signal })
		})
	} else {
		tl.to(pageOverlay, { opacity: 0.6, pointerEvents: "auto", duration: 1, ease: customEase })
		tl.to("#logo", { yPercent: 20, duration: 1, ease: customEase }, "<")
		tl.to(icon, { rotate: 90, duration: 1, ease: customEase }, "<")
		tl.to(navBg, { width: window.innerWidth, height: navigation.offsetHeight, top: 0, right: 0, borderRadius: 0, duration: 1, ease: customEase }, "<")
		tl.to(hambLabel, { y: "0%", duration: 1, ease: customEase }, "<")
		tl.to(links, { yPercent: 0, opacity: 1, duration: 0.35, stagger: { amount: 0.1, from: "start" }, ease: customEase }, "-=.3")

		hamburger.addEventListener("click", () => {
			if (!hamburger.classList.contains("opened")) {
				open()
				bodyTag.style.overflow = "hidden"
			} else {
				close(1.5)
				bodyTag.style.overflow = ""
			}
		}, { signal })
		links.forEach(link => link.addEventListener("click", () => {
			close(2)
			bodyTag.style.overflow = ""
		}, { signal }))
	}

	links.forEach(link => link.addEventListener("click", e => {
		e.preventDefault()
		// a theme can send menu links to other pages of its site (navLinks); the rest reload the listing
		const href = link.getAttribute("href")
		if (href.includes(".html")) wipe(() => { location.href = href })
		else pageToPage(current)
	}, { signal }))

	menuApi = {
		destroy() {
			abort.abort()
			tl.progress(0).kill()
			splits.forEach(s => s.revert())
			gsap.set([navBg, icon, pageOverlay, "#logo"], { clearProps: "all" })
			hamburger.classList.remove("opened")
			navigation.style.pointerEvents = "none"
		}
	}
}

// PAGE LIFECYCLE ////////////////////////////////////////////////////////////////////////////////////////////
function initPage() {
	const ctx = { abort: new AbortController(), splits: [], timers: [] }
	page = ctx
	rootTag.classList.toggle("mobile", isMobile() || window.innerWidth < 1024)

	fitTitle()
	smoothScroll()
	if (smoother) smoother.scrollTop(0)
	else window.scrollTo(0, 0)

	bodyTag.classList.remove("loading")
	gsap.to(".directors", { opacity: 1, duration: 0.5, ease: "power3.inOut" })
	lazyLoad(ctx)
	logoHide()
	heroAnim(ctx)
	directorsHover(ctx)
	dotMove(ctx)
	dirMobile(ctx)
	profileLinks(ctx)
	ScrollTrigger.refresh()
}

function destroyPage() {
	if (!page) return
	page.abort.abort()
	page.timers.forEach(clearTimeout)
	page.splits.forEach(s => s.revert())
	gsap.killTweensOf("#smooth-content, #smooth-content *, .bg-images img, #logo i")
	ScrollTrigger.killAll()
	if (smoother) { smoother.kill(); smoother = null }
	page = null
}

// URL: ?t=<theme>#/<person> — profile pages are pushed so the browser Back button works
function setUrl(person, push) {
	const url = new URL(location.href)
	url.searchParams.set("t", themes[current].id)
	url.hash = person ? "/" + person : ""
	if (!person) url.href = url.href.replace(/#$/, "")
	try { history[push ? "pushState" : "replaceState"](null, "", url) } catch (e) {} // file:// may refuse
}

let view = { type: "list" }

function load(index, push = false) {
	current = (index + themes.length) % themes.length
	const theme = themes[current]
	store.set("theme", theme.id)
	setUrl(null, push)
	view = { type: "list" }
	rootTag.classList.remove("is-profile")
	destroyPage()
	render(theme)
	menu()
	initPage()
}

// PROFILE PAGE /////////////////////////////////////////////////////////////////////////////////////////////
const pad = n => String(n).padStart(2, "0")
const arrowSvg = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>`

function renderProfile(theme, i) {
	const pr = profileFor(theme, i),
		n = theme.roster.length,
		nextIndex = (i + 1) % n,
		next = theme.roster[nextIndex],
		words = pr.name.split(" ")

	document.title = `${pr.name} - ${titleCase(theme.brand)}`
	contentTag.className = "director-detail"
	contentTag.innerHTML = `
		<section id="hero" class="dir-hero">
			<a href="${theme.profile.backHref || "./"}" class="back-link to-list f-14 p-in">&larr; ${theme.profile.back}</a>
			<div class="dir-img"><figure class="hero-img"><img src="${imageFor(theme, pr.name, 900, 1200)}" alt="${pr.name}"></figure></div>
			<h1 class="hero-split chars dir-name">${words[0]}<br>${words.slice(1).join(" ")}</h1>
		</section>

		<section id="bio" class="dir-bio">
			<span class="label f-14 view">About</span>
			<div class="bio-body">
				<p class="split lines bio-text">${pr.bio}</p>
				<dl class="facts f-14">
					<div class="view"><dt>Based in</dt><dd>${pr.city}</dd></div>
					<div class="view"><dt>Focus</dt><dd>${pr.focus.join(", ")}</dd></div>
					<div class="view"><dt>Clients</dt><dd>${pr.clients.join(", ")}</dd></div>
				</dl>
			</div>
		</section>

		<section id="work" class="dir-work">
			<div class="work-head">
				<h2 class="split chars">${theme.profile.work}</h2>
				<span class="f-14 view">(${pad(pr.work.length)})</span>
			</div>
			<div class="gallery">
				<ul class="track">${pr.work.map((w, k) => `
					<li class="${w.landscape ? "land" : "port"}">
						<figure><img src="${galleryImage(theme, pr.name, k, w.landscape ? 1600 : 1000, w.landscape ? 1000 : 1250)}"${photoPos(theme, galleryImage(theme, pr.name, k))} alt="${w.title ? `${w.client} — ${w.title}` : w.client}" draggable="false"></figure>
						<p class="f-14"><span>${pad(k + 1)}</span><span>${w.title ? `${w.client} &mdash; ${w.title}` : w.client}</span><span>${w.year}</span></p>
					</li>`).join("")}
				</ul>
			</div>
		</section>

		<section class="dir-back">
			<span class="f-14 view">${theme.profile.next}</span>
			<a href="#/${slug(next)}" class="next-link" data-index="${nextIndex}" aria-label="${next}">
				<h2 class="double-hover"><span>${next}</span><span aria-hidden="true">${next}</span></h2>
				<i class="arrow-btn">${arrowSvg}</i>
			</a>
		</section>

		<footer class="dir-foot f-14">
			<a href="${theme.profile.backHref || "./"}" class="to-list">&larr; ${theme.profile.back}</a>
			<span>${theme.brand} &copy; 2026</span>
		</footer>`
}

// fit a block of text so its widest line spans `maxW` px, capped at `maxVw`
function fitText(el, maxW, maxVw) {
	el.style.fontSize = maxVw + "vw"
	const probe = document.createElement("span")
	probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;"
	el.appendChild(probe)
	const widest = Math.max(...el.innerHTML.split(/<br\s*\/?>/i).map(t => {
		probe.textContent = t.replace(/<[^>]+>/g, "")
		return probe.offsetWidth
	}))
	probe.remove()
	if (widest > maxW) el.style.fontSize = (maxVw * maxW / widest) + "vw"
}

function initProfile(seamless, i) {
	const ctx = { abort: new AbortController(), splits: [], timers: [] }
	page = ctx
	const theme = themes[current],
		signal = ctx.abort.signal
	rootTag.classList.toggle("mobile", isMobile() || window.innerWidth < 1024)

	fitText(contentTag.querySelector(".dir-name"), window.innerWidth * 0.9166, isSmall() ? 26 : 20)
	fitText(contentTag.querySelector(".dir-back h2 span"), window.innerWidth * 0.62, isSmall() ? 15 : 12)
	contentTag.querySelector(".dir-back h2 span:nth-of-type(2)").style.fontSize = contentTag.querySelector(".dir-back h2 span").style.fontSize

	smoothScroll()
	if (smoother) smoother.scrollTop(0)
	else window.scrollTo(0, 0)
	bodyTag.classList.remove("loading")
	gsap.set(contentTag, { opacity: 1 })
	logoHide()

	// the person's photo stays as a dim, fixed backdrop
	const img = bgFigure.querySelector(`[data-page="${slug(theme.roster[i])}"]`)
	gsap.set(bgFigure, { opacity: 1 })
	gsap.set(gsap.utils.toArray(".bg-images img").filter(x => x !== img), { opacity: 0 })
	if (img && !seamless) {
		gsap.set(img, { opacity: 0, filter: "blur(15px)" })
		gsap.to(img, { opacity: 0.4, filter: "blur(0px)", duration: 1.2, ease: "power2" })
	}

	// HERO — same choreography as the original detail page
	const nameSplit = new SplitText(".dir-name", { type: "lines, chars", linesClass: "line", charsClass: "char" })
	ctx.splits.push(nameSplit)
	gsap.set(nameSplit.chars, { transformOrigin: "top left", y: "-30%", scaleY: 0 })
	gsap.set(".hero-img", { rotate: -15, scale: 0.8, opacity: 0 })
	gsap.set(".p-in", { opacity: 0 })
	if (smoother) smoother.paused(true)

	const tl = gsap.timeline()
	tl.to(nameSplit.chars, { duration: 1.5, stagger: { amount: 0.2 }, scaleY: 1, y: 0, ease: customEase })
	tl.to(".hero-img", { rotate: isSmall() ? -4 : -7, scale: 1, opacity: 1, duration: 1, ease: "power4" }, "-=.8")
	tl.to(".p-in", {
		opacity: 1, duration: 0.75, stagger: { amount: 0.2 }, ease: "power4",
		onComplete: () => {
			if (smoother) smoother.paused(false)
			// card tilts the other way as the hero scrolls out; it does not drift, or the hero's edge would cut it
			gsap.to(".hero-img", { rotate: 10, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } })
			if (img) gsap.fromTo(img, { opacity: 0.4 }, { opacity: 0.1, ease: "none", immediateRender: false, scrollTrigger: { trigger: "#bio", start: "top bottom", end: "top 30%", scrub: true } })
		}
	}, "-=1")

	textAnimations(ctx)
	inView()
	gallery()
	doubleHover(ctx)

	// links
	contentTag.querySelectorAll(".to-list").forEach(a => a.addEventListener("click", e => {
		e.preventDefault()
		const home = theme.profile.backHref
		wipe(() => (home ? location.assign(home) : load(current, true)))
	}, { signal }))
	contentTag.querySelector(".next-link").addEventListener("click", e => {
		e.preventDefault()
		openProfile(Number(e.currentTarget.dataset.index), false)
	}, { signal })

	ScrollTrigger.refresh()
}

// scroll-in text: chars rise from a squashed baseline, lines slide up (original textAnimations)
function textAnimations(ctx) {
	const chars = new SplitText("#smooth-content .split.chars", { type: "lines, chars", linesClass: "line", charsClass: "char" }),
		lines = new SplitText("#smooth-content .split.lines", { type: "lines", linesClass: "line" })
	ctx.splits.push(chars, lines)
	gsap.set(chars.chars, { transformOrigin: "0% 100%", y: "22%", scaleY: 0.2 })
	ScrollTrigger.batch(chars.chars, {
		start: "top 95%",
		onEnter: batch => gsap.to(batch, { duration: 1, stagger: { amount: 0.2 }, y: "0%", scaleY: 1, ease: customEase })
	})
	gsap.set(lines.lines, { opacity: 0, y: "150%" })
	ScrollTrigger.batch(lines.lines, {
		start: "top 95%",
		onEnter: batch => gsap.to(batch, { opacity: 1, duration: 1, y: 0, stagger: 0.03, ease: "expo.out" }),
		onLeaveBack: batch => gsap.to(batch, { opacity: 0, y: "150%", stagger: 0.03, ease: "power4" })
	})
}

function inView() {
	const items = gsap.utils.toArray("#smooth-content .view")
	gsap.set(items, { opacity: 0 })
	ScrollTrigger.batch(items, { start: "top 95%", onEnter: batch => gsap.to(batch, { opacity: 1, duration: 1, stagger: { amount: 0.2 }, ease: "power4.out" }) })
}

// THE GALLERY — the section is pinned while scrolling moves the row sideways, one pixel across per pixel down.
// A touch screen swipes the row instead: pinning under a finger is restless
function gallery() {
	const wrap = contentTag.querySelector(".gallery"),
		track = wrap.querySelector(".track"),
		travel = () => Math.max(0, track.scrollWidth - wrap.clientWidth)
	if (isMobile()) return wrap.classList.add("swipe")
	contentTag.querySelector("#work").classList.add("is-pinned") // one full screen, its content in the middle
	gsap.to(track, {
		x: () => -travel(),
		ease: "none",
		scrollTrigger: { trigger: "#work", start: "top top", end: () => "+=" + travel(), pin: true, scrub: true, invalidateOnRefresh: true }
	})
}

// letters swap to the accent copy on hover (original textDoubleHover)
function doubleHover(ctx) {
	// no cursor, no second copy: it would stand on top of the first in the hover colour
	if (!isDesktop()) return gsap.set("#smooth-content .double-hover span:nth-of-type(2)", { display: "none" })
	const signal = ctx.abort.signal
	gsap.utils.toArray("#smooth-content .double-hover").forEach(dh => {
		const host = dh.closest("a") || dh,
			cur = new SplitText(dh.querySelector("span:first-of-type"), { type: "chars" }),
			nxt = new SplitText(dh.querySelector("span:nth-of-type(2)"), { type: "chars" })
		ctx.splits.push(cur, nxt)
		gsap.set(nxt.chars, { yPercent: 22, scaleY: 0.2, transformOrigin: "bottom left" })
		gsap.set(cur.chars, { transformOrigin: "top left" })
		host.addEventListener("mouseenter", () => {
			gsap.to(cur.chars, { yPercent: -22, scaleY: 0.2, stagger: { amount: 0.1 }, duration: 0.6, ease: "power3" })
			gsap.to(nxt.chars, { yPercent: 0, scaleY: 1, stagger: { amount: 0.1 }, duration: 0.6, ease: "power3" })
		}, { signal })
		host.addEventListener("mouseleave", () => {
			gsap.to(cur.chars, { yPercent: 0, scaleY: 1, stagger: { amount: 0.1 }, duration: 0.6, ease: "power3" })
			gsap.to(nxt.chars, { yPercent: 22, scaleY: 0.2, stagger: { amount: 0.1 }, duration: 0.6, ease: "power3" })
		}, { signal })
	})
}

function showProfile(i, seamless) {
	const theme = themes[current]
	view = { type: "profile", i }
	rootTag.classList.add("is-profile")
	destroyPage()
	if (!seamless) renderChrome(theme)
	renderProfile(theme, i)
	const active = navInner.querySelector(".active")
	if (active) active.classList.remove("active") // "Photographers" leads back to the list from here
	menu()
	initProfile(seamless, i)
}

// LIST → PROFILE: no wipe — the hovered photo stays, the list folds away, the profile grows out of it
function openProfile(i, seamless) {
	const theme = themes[current]
	if (busy || !theme.profile) return
	setUrl(slug(theme.roster[i]), true)
	const img = bgFigure.querySelector(`[data-page="${slug(theme.roster[i])}"]`)
	if (!seamless || view.type !== "list" || !img) return wipe(() => showProfile(i, false))

	busy = true
	wrapperTag.style.pointerEvents = "none"
	if (page) { page.abort.abort(); page.timers.forEach(clearTimeout) } // freeze hover state
	gsap.killTweensOf(img)
	const tl = gsap.timeline({ onComplete: () => { showProfile(i, true); wrapperTag.style.pointerEvents = "auto"; busy = false } })
	tl.to(".dir-listing .char", { yPercent: -35, scaleY: 0, transformOrigin: "top left", stagger: { amount: 0.25 }, duration: 0.6, ease: "power3.in" }, 0)
	tl.to(".dir-title h1 .char", { yPercent: 110, stagger: { amount: 0.15 }, duration: 0.6, ease: "power3.in" }, 0)
	tl.to("#track", { opacity: 0, duration: 0.3 }, 0)
	tl.to(img, { opacity: 0.4, filter: "blur(0px)", duration: 0.8, ease: "power2.inOut" }, 0)
}

// roster names open their profile (themes with `profile` only)
function profileLinks(ctx) {
	if (!themes[current].profile) return
	gsap.utils.toArray(".directors li a").forEach(a => a.addEventListener("click", e => {
		e.preventDefault()
		openProfile(Number(a.dataset.index), isDesktop() && a.classList.contains("active"))
	}, { signal: ctx.abort.signal }))
}

// which page does the URL ask for?
function route(withWipe) {
	const m = location.hash.match(/^#\/(.+)$/),
		theme = themes[current],
		i = m && theme.profile ? theme.roster.findIndex(n => slug(n) === m[1]) : -1
	const go = i > -1 ? () => showProfile(i, false) : () => load(current)
	withWipe ? wipe(go) : go()
}
window.addEventListener("popstate", () => route(true))

// PAGE TO PAGE: accent sheet swings down, dark sheet follows, content sinks away ///////////////////////////////
const pageBgWrap = document.querySelector("#page-to-page"),
	redBg = pageBgWrap.querySelector(".red-bg"),
	greyBg = pageBgWrap.querySelector(".grey-bg")

function pageToPage(nextIndex) {
	const push = view.type === "profile"
	wipe(() => load(nextIndex, push))
}

function wipe(after) {
	if (busy) return
	busy = true
	wrapperTag.style.pointerEvents = "none"

	gsap.set([redBg, greyBg], { x: 0, y: 0, yPercent: -100, rotate: -45 })
	const tl = gsap.timeline()
	tl.to(redBg, { yPercent: 0, rotate: 0, duration: 1.5, ease: customEase, onStart: () => { pageBgWrap.style.opacity = "1" } })
	tl.to(greyBg, { yPercent: 0, rotate: 0, duration: 1.5, ease: customEase, onComplete: () => { pageBgWrap.style.opacity = "0" } }, "-=1.35")

	gsap.to("#smooth-content > *", { transformOrigin: "top left", yPercent: 35, opacity: 0, duration: 1.5, ease: customEase })

	// reset logo
	gsap.to("#logo .letter-first", { transformOrigin: "center left", scale: 1, duration: 0.4, ease: "power4.inOut" })
	gsap.to("#logo i:not(.letter-first)", { xPercent: 0, scale: 1, duration: 0.4, stagger: { amount: 0.1, from: "start" }, ease: "power4.inOut" })

	setTimeout(() => {
		after()
		wrapperTag.style.pointerEvents = "auto"
		busy = false
	}, 1500)
}

// THEME SWITCHER ////////////////////////////////////////////////////////////////////////////////////////////
switchTag.querySelectorAll("button[data-dir]").forEach(b => b.addEventListener("click", () => pageToPage(current + Number(b.dataset.dir))))
switchTag.querySelector(".palette").addEventListener("click", nextPalette)
document.addEventListener("keydown", e => {
	if (e.target.closest && e.target.closest("input, textarea")) return
	if (e.key === "p" || e.key === "P") nextPalette()
	if (e.key === "ArrowRight") pageToPage(current + 1)
	if (e.key === "ArrowLeft") pageToPage(current - 1)
	if (/^[0-9]$/.test(e.key)) pageToPage(e.key === "0" ? 9 : Number(e.key) - 1)
})
logoTag.addEventListener("click", e => {
	e.preventDefault()
	pageToPage(current)
})

// REBUILD WHEN CROSSING A BREAKPOINT ////////////////////////////////////////////////////////////////////////
// (width only — mobile address bars change the height while scrolling)
let lastWidth = window.innerWidth, resizeTimer
window.addEventListener("resize", () => {
	clearTimeout(resizeTimer)
	resizeTimer = setTimeout(() => {
		if (window.innerWidth === lastWidth || busy) return
		lastWidth = window.innerWidth
		view.type === "profile" ? showProfile(view.i, false) : load(current)
	}, 250)
})

// BOOT — wait for the display fonts so SplitText measures real glyphs //////////////////////////////////////////
window.addEventListener("pagehide", () => window.scrollTo(0, 0))
rootTag.classList.replace("no-js", "js")
Promise.all([
	document.fonts.load('900 100px "Anybody"'),
	document.fonts.load('700 100px "Anybody"'),
	document.fonts.load('800 30px "Archivo"'),
	document.fonts.load('400 16px "General Sans"'),
	document.fonts.load('700 16px "General Sans"')
]).catch(() => {}).finally(() => route(false))
