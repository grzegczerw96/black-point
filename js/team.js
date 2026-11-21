// BLACK POINT — TEAM. The shared chrome and sections live in site.js; this file is the page itself: pick what you are
// shooting and only the people who shoot it remain. One page, no sub-pages. Every person opens at #first-last.

// CONTENT /////////////////////////////////////////////////////////////////////////////////////////////////
const PEOPLE = theme.roster.map((n, i) => profileFor(theme, i))
const N = PEOPLE.length
const ANY = "Anything"
const mailto = subject => `mailto:studio@blackpoint.studio?subject=${encodeURIComponent(subject)}`
const first = p => p.name.split(" ")[0]
const portrait = p => `img/portraits/${slug(p.name)}.jpg` // stock pictures for now, see img/portraits/CREDITS.md
const profileUrl = p => `profile.html?p=${slug(p.name)}`
const TAGS = [...new Set(PEOPLE.flatMap(p => p.focus))]
	.map(tag => ({ tag, n: PEOPLE.filter(p => p.focus.includes(tag)).length }))
	.sort((a, b) => b.n - a.n || a.tag.localeCompare(b.tag))
// THE LAYOUT, from the window's shape and not its width alone (css/team.css, data-mode on .ca; chosen by the user 13.11):
//   low   — too little height for a portrait (below 640) in a window wider than it is tall (laptops, phones sideways):
//           the cards turn sideways, the portrait beside its text, and a whole card fits below the menu
//   phone — narrower than 600: one column of portraits
//   stack — an upright tablet (narrower than 1.1 × its height) or a window up to 1024 wide: the title and the filter
//           above two columns of portraits
//   desk  — the rest: the column with the title and the filter stands beside the portraits
const tmMode = (W = innerWidth, H = innerHeight) => (H < 640 && W > H ? "low" : W < 600 ? "phone" : W / H < 1.1 || W <= 1024 ? "stack" : "desk")
const stacked = () => tmMode() !== "desk"
// the bottom of the menu: what stands still on the page stands below it
const menuBottom = () => { const m = $("#hamburger"); return m.offsetTop + m.offsetHeight }

let picked = "" // the filter survives a resize or a turn of the phone

// THE PAGE //////////////////////////////////////////////////////////////////////////////////////////////////////
function casting(signal, split) {
	const root = $(".ca"), side = $(".ca-side"), grid = $(".ca-grid"), cards = $$(".ca-card"), tags = $$(".ca-tags button"), word = $(".ca-word"), count = $(".ca-count"), brief = $(".ca-brief"), pics = $$(".ca-card img")
	const matching = tag => PEOPLE.map((p, i) => (!tag || p.focus.includes(tag) ? i : -1)).filter(i => i > -1)
	word.textContent = picked || ANY
	gsap.set(word, { yPercent: 0 })
	gsap.set(cards, { clearProps: "opacity,transform" })
	tags.forEach(b => b.classList.toggle("on", b.dataset.tag === picked))
	if (!stacked()) ScrollTrigger.create({ trigger: root, start: "top top", end: "bottom bottom", pin: side, pinSpacing: false, invalidateOnRefresh: true })

	// where the column is not beside the cards, a small button brings the filter back while the cards are on screen
	const back = document.createElement("button")
	back.type = "button"
	back.className = "ca-back"
	back.addEventListener("click", () => scrollToTarget("top"), { signal })
	document.body.appendChild(back)
	signal.addEventListener("abort", () => back.remove())
	if (stacked()) ScrollTrigger.create({ trigger: grid, start: "top 40%", end: "bottom 70%", toggleClass: { targets: back, className: "on" } })

	// on load, as on Home: the title rises and the pictures come out of the page's own colour
	const rise = split([$(".ca-first"), word], { type: "chars", charsClass: "char" }).chars
	gsap.fromTo(rise, { transformOrigin: "top left", y: "-30%", scaleY: 0 }, { scaleY: 1, y: 0, duration: dur(1.5), stagger: { amount: dur(0.3) }, ease: customEase })
	const entered = new Set()
	const enter = (im, delay) => {
		entered.add(im)
		const t = dur(1) // read now: the picture's decode may end after a rebuilt page has settled
		Promise.race([im.decode().catch(() => {}), new Promise(r => setTimeout(r, 1200))]).then(() => { if (!signal.aborted) gsap.fromTo(im, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 2.2 * t, delay: delay * t, ease: "power2.out" }) })
	}
	gsap.set(pics, { opacity: 0 })
	const entering = ScrollTrigger.batch(pics, { start: "top 94%", once: true, onEnter: b => b.forEach((im, k) => enter(im, k * 0.1)) })

	let shown = cards.map((_, i) => i), flow = null, waiting = null
	const summary = list => {
		const all = list.length === N, names = list.map(first)
		count.textContent = all ? `All ${N}` : `${list.length} of ${N}`
		brief.textContent = all ? "Write to the studio" : `Brief ${names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0]}`
		brief.href = mailto(all ? "A new brief" : `${picked}: a brief for ${list.map(p => p.name).join(", ")}`)
		back.textContent = `${picked || ANY} · Change filter`
	}
	const place = next => {
		const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").length // every other column stands lower
		cards.forEach((c, i) => { const slot = next.indexOf(i); c.style.display = slot < 0 ? "none" : ""; c.style.order = slot; c.classList.toggle("ca-even", (slot % cols) % 2 === 1) })
		shown = next
		summary(next.map(i => PEOPLE[i]))
		ScrollTrigger.refresh()
	}
	// A change never sends a card across another. A card that keeps its slot stands still; the others go out where they
	// are, the list changes while nothing is on the move, and the new ones come in at their own slots
	const pick = tag => {
		if (tag === picked) return
		picked = tag
		const next = matching(tag)
		const stay = next.filter((i, slot) => shown[slot] === i), of = list => list.filter(i => !stay.includes(i)).map(i => cards[i])
		const going = of(shown), coming = of(next)
		if (flow) flow.kill() // a new pick stops the last one where it is and goes on from the current values
		if (waiting) waiting.kill()
		entering.forEach(t => t.kill())
		pics.forEach(im => { if (!entered.has(im)) { entered.add(im); gsap.set(im, { opacity: 1 }) } })
		tags.forEach(b => b.classList.toggle("on", b.dataset.tag === tag))
		gsap.to(word, { yPercent: -110, duration: 0.22, ease: "power3.in", overwrite: true, onComplete: () => { word.textContent = tag || ANY; gsap.fromTo(word, { yPercent: 110 }, { yPercent: 0, duration: 0.45, ease: "power3.out" }) } })
		// back to the start of the list first: the page gets shorter, and it must not do so under the visitor
		const y = stacked() ? grid.getBoundingClientRect().top - contentTop() - menuBottom() - 16 : 0 // the cards stand below the menu
		smoother ? smoother.scrollTo(y, true) : window.scrollTo({ top: y, behavior: "smooth" })
		let tries = 0
		const ready = () => {
			if (signal.aborted) return
			if (Math.abs(-contentTop() - y) > 4 && tries++ < 50) { waiting = gsap.delayedCall(0.03, ready); return }
			place(next)
			flow = gsap.fromTo(coming, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" })
		}
		// the order is strict: the list changes only when the cards going out are at opacity 0
		flow = gsap.timeline({ onComplete: ready })
		flow.to(going, { opacity: 0, y: 0, duration: 0.22, ease: "power1.in" }, 0)
		flow.to(stay.map(i => cards[i]), { opacity: 1, y: 0, duration: 0.22 }, 0)
		flow.set({}, {}, 0.22)
	}
	// PHONES (user 20.11.2026, version 2 without the full-screen layer): six disciplines and a button; the button opens the
	// whole list in place, pushing the portraits down, and a pick closes it again. The pick stands right after Anything,
	// marked, so the closed list keeps its length and always shows what is chosen
	const ul = $(".ca-tags"), more = $(".ca-more"), lis = [...ul.children], FIRST = 6
	const phone = () => tmMode() === "phone"
	let open = false
	const arrange = (tag = picked) => {
		const mine = lis.find(li => li.firstElementChild.dataset.tag === tag)
		const seq = phone() && tag ? [lis[0], mine, ...lis.slice(1).filter(li => li !== mine)] : lis
		seq.forEach((li, i) => { ul.appendChild(li); li.classList.toggle("ca-extra", phone() && i >= FIRST) })
	}
	const setOpen = on => {
		const from = ul.offsetHeight
		open = on
		ul.classList.toggle("open", on)
		more.classList.toggle("open", on)
		$("span", more).textContent = on ? "Fewer disciplines" : "All disciplines"
		more.setAttribute("aria-expanded", on)
		const to = ul.offsetHeight
		gsap.fromTo(ul, { height: from }, { height: to, duration: dur(0.45), ease: "power3.out", clearProps: "height", onComplete: () => ScrollTrigger.refresh() })
		if (on) gsap.fromTo($$(".ca-extra", ul), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: dur(0.4), stagger: dur(0.02), ease: "power3.out" })
	}
	arrange()
	more.addEventListener("click", () => setOpen(!open), { signal })
	tags.forEach(b => b.addEventListener("click", () => {
		if (phone() && b.dataset.tag !== picked) { // close first, with the pick in its new place, so the page measures the short list
			arrange(b.dataset.tag)
			if (open) { open = false; ul.classList.remove("open"); more.classList.remove("open"); $("span", more).textContent = "All disciplines"; more.setAttribute("aria-expanded", false) }
		}
		pick(b.dataset.tag)
	}, { signal }))
	$$(".ca-main").forEach(a => a.addEventListener("click", e => { e.preventDefault(); leaveTo(a.href) }, { signal }))
	place(matching(picked))
}
// how far the page has scrolled, smoothed where the smoother runs: minus the top of the content
const contentTop = () => (smoother ? smoother.content().getBoundingClientRect().top : -window.scrollY)

function castingFit() {
	const q = $(".ca-q"), grid = $(".ca-grid"), cards = $$(".ca-card"), names = $$(".ca-name"), probe = document.createElement("span")
	const mode = tmMode(), mb = menuBottom()
	$(".ca").style.setProperty("--menu-bottom", mb + "px")
	// low windows: the portrait is as tall as the room between the menu (where a pick stops the page) and the bottom of
	// the screen; two cards to a row where each keeps at least 240 px for its text
	grid.style.removeProperty("--cols")
	grid.style.removeProperty("--pic-w")
	if (mode === "low") {
		const gap = parseFloat(getComputedStyle(grid).columnGap), width = grid.clientWidth, room = innerHeight - mb - 16 - gap
		const pic = room * 0.8, tight = parseFloat(getComputedStyle(cards[0]).columnGap) || 16
		grid.style.setProperty("--cols", width >= 2 * (pic + tight + 240) + gap ? 2 : 1)
		grid.style.setProperty("--pic-w", pic + "px")
	}
	// the widest word has to fit, or the headline would change size or rewrap when it changes. Measured on a probe:
	// this runs again after the title is split into letters
	const box = q.offsetWidth
	q.style.fontSize = "100px"
	q.appendChild(probe)
	const widest = Math.max(...["Who shoots", ANY, ...TAGS.map(t => t.tag)].map(t => { probe.textContent = t; return probe.offsetWidth }))
	probe.remove()
	q.style.fontSize = Math.min(100 * box / widest, Math.max(innerHeight * 0.15, 44)) + "px"
	// every name on one line in its card, at one size; every row the same height, so a card that stays never moves
	const hidden = cards.map(c => c.style.display) // this also runs after a filter was restored
	cards.forEach(c => { c.style.display = "" })
	grid.style.gridAutoRows = ""
	names.forEach(n => { n.style.fontSize = "50px" })
	const size = Math.min(stacked() ? 40 : 48 * u(), Math.max(innerHeight * 0.08, 28), 50 * names[0].closest(".ca-text").offsetWidth / Math.max(...names.map(n => n.scrollWidth)))
	names.forEach(n => { n.style.fontSize = size + "px" })
	grid.style.gridAutoRows = Math.max(...cards.map(c => c.offsetHeight)) + "px"
	cards.forEach((c, i) => { c.style.display = hidden[i] })
}

boot({
	render() {
		const mode = tmMode()
		$(".tm-team").innerHTML = `<div class="ca" data-mode="${mode}" data-layout="${mode === "desk" ? "side" : "stack"}">
			<aside class="ca-side">
				<h1 class="ca-q display"><span class="ca-first">Who shoots</span><span class="ca-clip"><span class="ca-word">${ANY}</span></span></h1>
				<div class="ca-low">
					<p class="caps ca-label">Filter by discipline</p>
					<ul class="ca-tags"><li><button type="button" class="on" data-tag=""><i></i><span>${ANY}</span><small>${N}</small></button></li>${TAGS.map(t => `<li><button type="button" data-tag="${t.tag}"><i></i><span>${t.tag}</span><small>${t.n}</small></button></li>`).join("")}</ul>
					<button type="button" class="ca-more" aria-expanded="false"><b aria-hidden="true"></b><em><span>All disciplines</span><small>${TAGS.length}</small></em></button>
					<div class="ca-foot"><span class="caps ca-count"></span><a class="ca-brief"></a></div>
				</div>
			</aside>
			<div class="ca-grid">${PEOPLE.map(p => `
				<article class="ca-card" id="${slug(p.name)}">
					<a class="ca-main" href="${profileUrl(p)}" aria-label="${p.name}: profile"><img data-pic="${portrait(p)}" alt="${p.name}"><i class="ca-go"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 17.5 17 7M8.5 6.5H17.5V15.5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg></i></a>
					<div class="ca-text">
						<div class="ca-head"><h2 class="ca-name">${p.name}</h2><p class="caps ca-meta">${p.city} · ${p.focus.join(", ")}</p></div>
						<p class="ca-bio">${p.bio}</p>
					</div>
				</article>`).join("")}
			</div>
		</div>`
	},
	fit: castingFit,
	scrollTo(target) {
		const el = PEOPLE.some(p => slug(p.name) === target) && smoother && document.getElementById(target)
		if (!el) return false
		smoother.scrollTo(el, true, stacked() ? `top ${menuBottom() + 16}px` : "top 84px")
		return true
	},
	init(split, signal) { casting(signal, split) }
})
