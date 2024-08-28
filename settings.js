const videoSpeedRangeContainer = document.querySelector("#video-speed-range-container")
const videoSpeedLabel = videoSpeedRangeContainer.querySelector("label")
const videoSpeedRange = videoSpeedRangeContainer.querySelector("input[type=\"range\"]")
const possibleVideoSpeeds = [0.1, 0.2, 0.3, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2, 3, 5, 10]

videoSpeedRange.addEventListener("input", () => {
    const newSpeed = possibleVideoSpeeds[videoSpeedRange.value]
    if (!newSpeed) return

    videoSpeedLabel.textContent = `Video Speed: ${newSpeed}x`
    timelineState.videoSpeed = newSpeed
})

let countingLineStartX = 0
let countingLineStartY = 0
let countingLineEndX = 0
let countingLineEndY = 0
let countingLineWidth = 5

function loadCountingLine() {
    countingLineStartX = localStorage.getItem("clsx") ?? 0
    countingLineStartY = localStorage.getItem("clsy") ?? 0
    countingLineEndX   = localStorage.getItem("clex") ?? 0
    countingLineEndY   = localStorage.getItem("cley") ?? 0
    countingLineWidth  = localStorage.getItem("clw") ?? 5

    document.getElementById("counting-line-start-x").value = countingLineStartX
    document.getElementById("counting-line-start-y").value = countingLineStartY
    document.getElementById("counting-line-end-x").value = countingLineEndX
    document.getElementById("counting-line-end-y").value = countingLineEndY
    document.getElementById("counting-line-width").value = countingLineWidth
}

function saveCountingLine() {
    localStorage.setItem("clsx", countingLineStartX)
    localStorage.setItem("clsy", countingLineStartY)
    localStorage.setItem("clex", countingLineEndX)
    localStorage.setItem("cley", countingLineEndY)
    localStorage.setItem("clw",  countingLineWidth)
}

function hookCountingLineRange(rangeId, setter) {
    const range = document.getElementById(rangeId)
    range.addEventListener("input", () => {
        setter(range.value)
        saveCountingLine()
        updateVideoCanvasContent()
    })
}

function renderCountingLine() {
    videoContext.beginPath()
    videoContext.moveTo(
        countingLineStartX / 100 * videoCanvas.width,
        countingLineStartY / 100 * videoCanvas.height
    )
    videoContext.lineTo(
        countingLineEndX / 100 * videoCanvas.width,
        countingLineEndY / 100 * videoCanvas.height
    )
    videoContext.strokeStyle = "rgba(0, 255, 0, 0.5)"
    videoContext.lineWidth = countingLineWidth
    videoContext.lineCap = "round"
    videoContext.stroke()
}

hookCountingLineRange("counting-line-start-x", v => countingLineStartX = v)
hookCountingLineRange("counting-line-start-y", v => countingLineStartY = v)
hookCountingLineRange("counting-line-end-x",   v => countingLineEndX   = v)
hookCountingLineRange("counting-line-end-y",   v => countingLineEndY   = v)
hookCountingLineRange("counting-line-width",   v => countingLineWidth  = v)

loadCountingLine()