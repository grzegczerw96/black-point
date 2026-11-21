// BLACK POINT — PROJECTS. One page, no sub-pages. The first screen hangs all twelve projects as prints, and scrolling
// simply goes on to the next section. A click walks up to one project, which then fills the screen with all it has to
// say. There, scrolling goes to the next or previous project without ever showing the wall; the X goes back to it.

// CONTENT /////////////////////////////////////////////////////////////////////////////////////////////////
// one per photographer, in the order of the roster: their data live in js/themes.js
const PROJECTS = theme.roster.map((who, i) => ({ ...theme.profile.projects[i], who, cover: imageFor(theme, who) }))
const N = PROJECTS.length
// the project's other pictures, skipping the one used as its cover
const extras = (p, n) => Array.from({ length: 6 }, (_, k) => galleryImage(theme, p.who, k + 1)).filter(src => src !== p.cover).slice(0, n)
const credits = p => `<dl class="pj-credits"><dt>Photography</dt><dd>${p.who}</dd><dt>Client</dt><dd>${p.client}</dd><dt>Year</dt><dd>${p.year}</dd></dl>`

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const RADIUS = 6 // radius/m
let openAt = null // the open project survives a resize or a turn of the phone: init() opens it again, with no entrance

// FROM ONE PROJECT TO THE NEXT. The sheet is opaque, so the two contents never mix
const NEXT_AFTER = 0.49 // seconds: from here a further move of the wheel already brings the next project
// The new page comes over this one like a sheet laid on top, from below or above with the scroll. This one hardly moves
// and is dark before the sheet is halfway, so nothing of it shows (version 1, chosen by the user 13.11)
function changePage(out, inn, dir) {
	const tl = gsap.timeline(), dim = $(".pv-dim", out)
	gsap.set(inn, { autoAlpha: 1, yPercent: 100 * dir, zIndex: 7 })
	gsap.set(dim, { opacity: 0 })
	// it starts at once, under the wheel, and has all but arrived by NEXT_AFTER
	tl.to(inn, { yPercent: 0, duration: 0.7, ease: "power4.out" }, 0)
	tl.to(out, { yPercent: -6 * dir, duration: 0.7, ease: "power4.out" }, 0)
	tl.to(dim, { opacity: 1, duration: 0.3, ease: "power2.out" }, 0)
	tl.fromTo($(".pv-a img", inn), { scale: 1.08 }, { scale: 1, duration: 0.9, ease: "expo.out" }, 0)
	return tl
}

// THE WALL: prints in rows of different sizes, a caption under each. Upright prints hang no narrower than MIN_TILE,
// which keeps the rows at the full width of the screen /////////////////////////////////////////////////////////
const MIN_TILE = 1.33
// the layout from the window's shape, as Studio's How we work: a low window (flat: a phone held sideways, below 500 px
// of height), an upright tablet, a phone or a desktop. It sets the rows of the wall here and the project page in
// css/projects.css (data-mode)
const pjMode = () => {
	const W = window.innerWidth, H = window.innerHeight, ratio = W / H
	if (ratio >= 1.9 || (H < 700 && (W >= 600 || ratio >= 1.1))) return H < 500 ? "flat" : "low"
	if (ratio < 1.1 && W > 600) return "tall"
	return isSmall() ? "phone" : "desk"
}
const ROWS = { desk: [4, 4, 4], phone: [2, 2, 2, 2, 2, 2], tall: [3, 3, 3, 3], low: [6, 6], flat: [6, 6] }
function placeTiles(vw, vh, asp) {
	const top = Math.max(84, vh * 0.125), bottom = Math.max(52, vh * 0.085), side = (window.innerWidth - measure()) / 2, gap = Math.max(8, 8 + 8 * (vw - 375) / 1065) /* 8 at 375, 16 at 1440 (was 1.2% of the width: 10 and 17.3) */, capH = isSmall() ? 20 : 26
	const rows = ROWS[pjMode()]
	const room = vh - top - bottom - rows.length * capH - (rows.length - 1) * gap
	let n = 0
	const plan = rows.map(c => { const items = asp.slice(n, n + c); n += c; return { items, h: (vw - 2 * side - gap * (c - 1)) / items.reduce((a, b) => a + b, 0) } })
	const k = Math.min(1, room / plan.reduce((a, r) => a + r.h, 0))
	let y = top + (room - plan.reduce((a, r) => a + r.h * k, 0)) / 2
	const out = []
	plan.forEach(r => {
		const h = r.h * k, width = r.items.reduce((a, b) => a + b * h, 0) + gap * (r.items.length - 1)
		let x = (vw - width) / 2
		r.items.forEach(a => { out.push({ R: { x, y, w: a * h, h }, cap: { x, y: y + h + 4, w: a * h, h: capH } }); x += a * h + gap })
		y += h + capH + gap
	})
	return out
}

// LIGHTER PHOTOGRAPHS (13.11.2026): a print on the wall loads a copy only as large as it hangs (pic() in js/site.js), its
// size worked out from the same layout before the page is made. The larger copy for the open project comes before the
// camera moves (open()), and the others follow once the page has loaded (preloadLater())
const ratio = i => picRatio(PROJECTS[i].cover)
function thumbs() {
	if (!PROJECTS.every((p, i) => ratio(i))) return PROJECTS.map(p => p.cover)
	const vw = window.innerWidth, vh = window.innerHeight
	return placeTiles(vw, vh, PROJECTS.map((p, i) => Math.max(ratio(i), MIN_TILE))).map(({ R }, i) => {
		const asp = ratio(i), w = asp > R.w / R.h ? R.h * asp : R.w // the whole photograph around the tile, as in layout()
		return pic(PROJECTS[i].cover, w * density())
	})
}
const pageLayer = (cls = "") => `<div class="pv${cls}">
	<i class="pv-dim"></i>
	<div class="pv-text"><div><span class="caps pv-no"></span><h2 class="pv-title"></h2><p class="pv-line"></p></div><div class="pv-credits"></div></div>
	<figure class="pv-a"><img alt=""></figure>
	<figure class="pv-b"><img alt=""></figure>
	<figure class="pv-c"><img alt=""></figure>
</div>`
function pageHtml() {
	const src = thumbs()
	// the prints start unseen (inline, so the entrance's clearProps gives them back): the page is drawn before init() runs
	// (it waits for the fonts), and with the pictures in the browser's cache the whole wall flashed up and out again (19.11.2026)
	return `<div class="pj-pin" data-mode="${pjMode()}">
		<div class="wl">${PROJECTS.map((p, i) => `
			<a class="t" href="#" aria-label="${p.title}" style="opacity: 0">
				<div class="t-box"><img src="${src[i]}" alt="" draggable="false"></div>
				<div class="t-cap"><b>${pad(i + 1)}</b><span>${p.title}</span></div>
			</a>`).join("")}</div>
		<p class="wl-cap"><span class="caps">Selected work</span> Twelve projects. Click one to see it.</p>
		${pageLayer()}${pageLayer()}${pageLayer(" pv-probe")}
		<button type="button" class="pv-x" aria-label="Back to all projects"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>
	</div>`
}

// THE CAMERA ////////////////////////////////////////////////////////////////////////////////////////////////////
function wall(signal) {
	const pin = $(".pj-pin"), sheet = $(".wl"), tiles = $$(".t"), boxes = $$(".t-box"), caps = $$(".t-cap"), imgs = $$(".t-box img"), layers = $$(".pv:not(.pv-probe)"), probe = $(".pv-probe"), x = $(".pv-x")
	const cam = { s: 1, px: 0, py: 0, ox: 0, oy: 0 }, state = { others: 1, open: 0 }
	let spots = [], insets = [], sizes = [], big = [], small = [], overview = {}, cur = null, busy = false, changing = false, front = 0, tl = null, ready = false
	const aspect = i => ratio(i) || imgs[i].naturalWidth / imgs[i].naturalHeight || 1.6

	const layout = () => {
		const vw = pin.offsetWidth, vh = pin.offsetHeight, place = placeTiles(vw, vh, imgs.map((im, i) => Math.max(aspect(i), MIN_TILE))), box = pin.getBoundingClientRect()
		overview = { s: 1, px: vw / 2, py: vh / 2, ox: vw / 2, oy: vh / 2 }
		const atTop = getComputedStyle($(".pv-a", probe)).alignItems === "start"
		const menu = $("#hamburger").getBoundingClientRect(), clear = menu.bottom + (parseFloat(getComputedStyle(probe).rowGap) || 0) / 2 // the menu on the screen, where the pin stands while a project is open
		place.forEach(({ R, cap }, i) => {
			// the room for the photograph on this project's own page: where the text stands above it, it depends on the text
			words(probe, i)
			const r = $(".pv-a", probe).getBoundingClientRect(), a = { left: r.left - box.left, right: r.right - box.left, top: r.top - box.top, bottom: r.bottom - box.top, width: r.width, height: r.height }, ax = a.left + a.width / 2
			// the whole photograph around the tile; on the wall an upright print shows only its middle, so the rows fill the width
			const asp = aspect(i), wide = asp > R.w / R.h, w = wide ? R.h * asp : R.w, h = wide ? R.h : R.w / asp, bx = R.x + R.w / 2 - w / 2, by = R.y + R.h / 2 - h / 2
			boxes[i].style.cssText = `left:${bx}px;top:${by}px;width:${w}px;height:${h}px`
			caps[i].style.cssText = `left:${cap.x}px;top:${cap.y}px;width:${cap.w}px;height:${cap.h}px`
			insets[i] = [R.y - by, bx + w - R.x - R.w, by + h - R.y - R.h, R.x - bx]
			let s = Math.min(a.width / w, a.height / h), dy = 0
			// at rest nothing lies under the menu: a photograph that would reach under it is fitted into its room below the menu
			const top = a.top + (atTop ? 0 : (a.height - h * s) / 2), half = (a.width - w * s) / 2
			if (top < clear && a.right - half > menu.left && a.left + half < menu.right) {
				const room = a.bottom - clear
				s = Math.min(a.width / w, room / h)
				dy = clear + (room - h * s) / 2 - (a.top + (a.height - h * s) / 2)
			}
			// the camera brings the photograph to where the page shows it: in the middle of its room, or at its top
			const ay = a.top + (atTop ? h * s / 2 : a.height / 2) + dy
			spots[i] = { s, px: bx + w / 2, py: by + h / 2, ox: ax, oy: ay }
			sizes[i] = { w: w * s, h: h * s, dy }
			// the copies the open project needs: the photograph as large as the camera brings it, the two small ones as they hang
			big[i] = pic(PROJECTS[i].cover, sizes[i].w * density())
			const f = $(".pv-b", probe).getBoundingClientRect(), fw = f.width, fh = f.height || f.width
			small[i] = extras(PROJECTS[i], 2).map(src => pic(src, Math.max(fw, fh * (picRatio(src) || 1)) * density()))
		})
		gsap.set(cam, cur === null ? overview : spots[cur])
		if (cur !== null) fitPic(layers[front], cur)
		render()
	}
	const render = () => {
		const s = cam.s
		sheet.style.transform = `translate3d(${cam.ox - s * cam.px}px,${cam.oy - s * cam.py}px,0) scale(${s})`
		tiles.forEach((t, i) => {
			const on = i === cur, open = on ? state.open : 0
			t.style.opacity = on ? 1 : state.others
			caps[i].style.opacity = on ? state.others : 1
			// the corner stays the same on screen at any zoom
			boxes[i].style.clipPath = `inset(${insets[i].map(v => v * (1 - open) + "px").join(" ")} round ${RADIUS / s}px)`
		})
		pin.classList.toggle("is-wall", cur === null && !busy)
	}
	// the photograph keeps the size the camera brought it to (known once the wall is laid out)
	const fitPic = (page, i) => {
		if (!sizes[i]) return
		const pic = $(".pv-a img", page)
		pic.style.width = sizes[i].w + "px"
		pic.style.height = sizes[i].h + "px"
		page.style.setProperty("--pic-h", sizes[i].h + "px")
		page.style.setProperty("--pic-dy", sizes[i].dy + "px")
	}
	const words = (page, i) => {
		const p = PROJECTS[i]
		$(".pv-no", page).textContent = `${pad(i + 1)} / ${pad(N)}`
		$(".pv-title", page).textContent = p.title
		$(".pv-line", page).textContent = p.line
		$(".pv-credits", page).innerHTML = credits(p)
	}
	const fill = (page, i) => {
		const p = PROJECTS[i], [a, b] = small[i] || extras(p, 2), img = $(".pv-a img", page)
		img.src = big[i] || p.cover
		fitPic(page, i)
		$(".pv-b img", page).src = a
		$(".pv-c img", page).src = b
		words(page, i)
	}
	const clearPage = page => {
		const all = [page, ...$$(".pv-dim, .pv-text, .pv-a, .pv-a img, .pv-b, .pv-c, .pv-no, .pv-title, .pv-line, .pv-credits", page)]
		gsap.killTweensOf(all)
		gsap.set(all, { clearProps: "transform,opacity,clipPath,visibility,zIndex" })
	}
	const lock = on => {
		if (smoother) smoother.paused(on)
		else holdScroll(on) // on touch this also stops the script that scrolls the page
	}
	const showPage = on => {
		gsap.set(layers[front], { autoAlpha: on ? 1 : 0, zIndex: 6 })
		gsap.set(x, { autoAlpha: on ? 1 : 0 })
		// the wall waits behind a project, unseen: it must never show through a change of project
		sheet.style.visibility = on ? "hidden" : "visible"
	}

	// the wall → one project: first the other prints go, then the camera arrives, and only then the page around the
	// photograph appears. Nothing from the wall is left when the text comes in
	// The print on the wall is a small copy: the camera starts only once the larger one is in the print, so it never blurs
	// (usually at once: it was fetched after the page loaded, or when the pointer came over the print)
	const neighbours = (i, dirs) => dirs.forEach(d => { const k = (i + d + N) % N; [big[k], ...small[k]].forEach(src => preload(src)) })
	const open = i => {
		if (busy || cur !== null || !ready) return
		busy = true
		lock(true)
		preload(big[i], "high").then(() => {
			if (signal.aborted) return
			imgs[i].src = big[i]
			return imgs[i].decode().catch(() => {})
		}).then(() => {
			if (signal.aborted) return
			cur = openAt = i
			fill(layers[front], i)
			neighbours(i, [1, -1])
			const D = 0.9, to = spots[i]
			tl = gsap.timeline({ onUpdate: render, onComplete: () => { showPage(true); gsap.fromTo(layers[front], { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out", onComplete: () => { busy = false } }); render() } })
			tl.to(state, { others: 0, duration: 0.3, ease: "power1.out" }, 0)
			tl.to(state, { open: 1, duration: D - 0.3, ease: "power2.inOut" }, 0.3)
			tl.to(cam, { s: to.s, px: to.px, py: to.py, ox: to.ox, oy: to.oy, duration: D, ease: "power2.inOut" }, 0)
		})
	}
	// one project → the wall, the same steps backwards
	const close = () => {
		if (busy || cur === null) return
		busy = true
		openAt = null
		sheet.style.visibility = "visible"
		gsap.set(x, { autoAlpha: 0 })
		const D = 0.85
		tl = gsap.timeline({ onUpdate: render, onComplete: () => { cur = null; busy = false; lock(false); render() } })
		tl.to(layers[front], { autoAlpha: 0, duration: 0.25, ease: "power1.in" }, 0)
		tl.to(cam, { s: overview.s, px: overview.px, py: overview.py, ox: overview.ox, oy: overview.oy, duration: D, ease: "power2.inOut" }, 0.25)
		tl.to(state, { open: 0, duration: 0.3, ease: "power2.inOut" }, 0.25)
		tl.to(state, { others: 1, duration: 0.4, ease: "power1.in" }, 0.25 + D - 0.4)
	}
	// one project → the next or previous one; past the last comes the first again
	const change = dir => {
		if (cur === null) return
		if (busy) {
			if (!changing || tl.time() < NEXT_AFTER) return
			tl.progress(1) // the sheet has all but arrived: lay it down and go on
		}
		busy = changing = true
		const next = (cur + dir + N) % N, out = layers[front], inn = layers[1 - front]
		clearPage(inn)
		fill(inn, next)
		cur = openAt = next
		neighbours(next, [dir])
		gsap.set(cam, spots[next]) // the camera is already there for when the X goes back
		render()
		tl = changePage(out, inn, dir)
		tl.eventCallback("onComplete", () => {
			gsap.set(out, { autoAlpha: 0 })
			clearPage(out)
			gsap.set(out, { autoAlpha: 0 })
			front = 1 - front
			gsap.set(inn, { zIndex: 6 })
			busy = changing = false
		})
	}

	addEventListener("wheel", e => { if (cur !== null && !e.ctrlKey && e.deltaY) change(Math.sign(e.deltaY)) }, { signal, passive: true })
	addEventListener("keydown", e => {
		if (cur === null) return
		if (e.key === "Escape") return close()
		const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0
		if (dir) { e.preventDefault(); change(dir) }
	}, { signal })
	let touchY = 0
	addEventListener("touchstart", e => { touchY = e.touches[0].clientY }, { signal, passive: true })
	addEventListener("touchend", e => { const d = touchY - e.changedTouches[0].clientY; if (cur !== null && Math.abs(d) > 40) change(Math.sign(d)) }, { signal, passive: true })
	tiles.forEach((t, i) => t.addEventListener("pointerenter", () => { if (ready) preload(big[i], "high") }, { signal }))
	tiles.forEach((t, i) => t.addEventListener("click", e => {
		e.preventDefault()
		const y = smoother ? smoother.scrollTop() : window.scrollY
		if (y < 4) return open(i)
		// a little way down the page: bring the wall back first, the camera works on the screen as it stands
		if (smoother) { smoother.scrollTo(0, true); gsap.delayedCall(0.8, () => { if (!signal.aborted) open(i) }) } else { window.scrollTo(0, 0); open(i) }
	}, { signal }))
	x.addEventListener("click", close, { signal })
	signal.addEventListener("abort", () => { if (tl) tl.kill(); lock(false) })

	// the photographs' own proportions decide the layout. They are known from img/opt/sizes.js, so the prints get their
	// places at once and nothing moves while they load (13.11.2026; before, the layout waited for the photographs)
	const known = PROJECTS.every((p, i) => ratio(i))
	// a project that was open before the window changed is open again at once: no wall, no camera, no fade
	if (openAt !== null) {
		cur = openAt
		state.others = 0
		state.open = 1
		lock(true)
	}
	// the prints stay unseen until they come in, as before. The layout runs at once, in the page's start: laid out a task
	// later, the prints first stood in a heap and the move counted as a layout shift (CLS 0.32), unseen as they are
	let laid = false
	const place = () => { if (laid) return; laid = true; layout(); gsap.set(tiles, { opacity: 0 }) }
	if (known) place()
	if (cur !== null) {
		fill(layers[front], cur)
		showPage(true)
	}
	const t = dur(1) // read now: the decode may end after a rebuilt page has settled
	Promise.all(imgs.map(im => im.decode().catch(() => {}))).then(() => {
		if (signal.aborted) return
		place()
		ready = true
		gsap.fromTo(tiles, { opacity: 0 }, { opacity: 1, duration: t, stagger: 0.05 * t, ease: "power2.out", clearProps: "opacity", onComplete: render })
		// the larger copies for the open projects, after the page has loaded
		preloadLater([...big, ...small.flat()])
	})
}

boot({
	render() {
		$(".pj").innerHTML = pageHtml()
	},
	init(split, signal) { wall(signal) }
})
