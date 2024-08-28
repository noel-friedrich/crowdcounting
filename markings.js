const markingsOutput = document.querySelector("#markings-output")

const MARKING_LENGTH_SECONDS = 2.0

let markings = []

class Marking {
    constructor(ms, x, y) {
        this.ms = Math.round(ms)
        this.x = Math.round(x)
        this.y = Math.round(y)
    }

    get timestamp() {
        return this.ms / 1000
    }

    toObject() {
        return [this.ms, this.x, this.y]
    }

    toString() {
        return `${this.ms},${this.x},${this.y}`
    }

    static fromString(string) {
        const args = string.split(",").map(s => parseInt(s))
        return Marking.fromObject(args)
    }

    static fromObject(obj) {
        return new Marking(...obj)
    }
}

function downloadTxt(filename, content) {
    var element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content))
    element.setAttribute("download", filename)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
}

function saveMarkings() {
    const markingString = markings.map(m => m.toString()).join(";")
    localStorage.setItem("markings", markingString)
    markingsOutput.textContent = markings.length
}

function loadMarkings() {
    const markingString = localStorage.getItem("markings")
    if (markingString === null) {
        return []
    }

    try {
        return markingString.split(";").map(s => Marking.fromString(s))
    } catch (e) {
        console.error(e)
        return []
    }
}

function resetMarkings() {
    if (markings.length == 0) {
        return
    }

    if (confirm(`Do you really want to clear all ${markings.length} markings?`)) {
        markings = []
        saveMarkings()
        updateVideoCanvasContent()
    }
}

function deleteLastMarking() {
    if (!markings.pop()) {
        alert("No marking found")
    } else {
        saveMarkings()
        updateVideoCanvasContent()
    }
}

function getVisibleMarkings() {
    return markings.filter(m => {
        const timeDelta = timelineState.currTime - m.timestamp 
        // >= -0.01 because of floating point misery
        return timeDelta > -0.01 && timeDelta < MARKING_LENGTH_SECONDS
    })
}

function deleteVisibleMarkings() {
    for (const marking of getVisibleMarkings()) {
        marking._deleteFlag = true
    }

    const prevLength = markings.length
    markings = markings.filter(m => !m._deleteFlag)
    const deleteCount = prevLength - markings.length
    alert(`Deleted ${deleteCount} marking(s)`)
    saveMarkings()
    updateVideoCanvasContent()
}

markings = loadMarkings()
saveMarkings()

function downloadMarkings() {
    if (markings.length == 0) {
        return alert("You haven't made any markings yet.")
    }

    const markingString = markings.map(m => m.toString()).join("\n")
    const headerString = "Timestamp (s),X-Position (%),Y-Position (%)\n"
    downloadTxt("markings.csv", headerString + markingString)
}

videoCanvas.addEventListener("click", event => {
    if (!currVideoElement) {
        return
    }

    const rect = videoCanvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / videoCanvas.width * 100
    const y = (event.clientY - rect.top) / videoCanvas.height * 100
    markings.push(new Marking(timelineState.ms, x, y))
    saveMarkings()
    updateVideoCanvasContent()
})

function renderMarkings() {
    const visibleMarkings = getVisibleMarkings()

    for (const marking of visibleMarkings) {
        const progress = 1 - (timelineState.currTime - marking.timestamp) / MARKING_LENGTH_SECONDS
        const color = `rgba(0, 0, 255, ${(progress ** 2) * 0.7})`
        const xPosition = marking.x / 100 * videoCanvas.width
        const yPosition = marking.y / 100 * videoCanvas.height
        const radius = progress * videoCanvas.height * 0.08

        videoContext.beginPath()
        videoContext.arc(xPosition, yPosition, radius, 0, Math.PI * 2)
        videoContext.fillStyle = color
        videoContext.fill()
    }
}