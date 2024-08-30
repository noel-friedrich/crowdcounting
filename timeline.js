const timelineCanvas = document.querySelector("#timelineCanvas")
const timelineContext = timelineCanvas.getContext("2d")

const timelineState = {
    currTime: 0.0,
    viewStart: -0.5,
    viewEnd: 10.5,
    hoverTime: null,
    mouseDown: false,
    _videoSpeed: 1,

    get ms() {
        return Math.round(this.currTime * 1000)
    },

    get videoSpeed() {
        return this._videoSpeed
    },

    set videoSpeed(newValue) {
        this._videoSpeed = newValue
        if (currVideoElement) {
            currVideoElement.playbackRate = newValue
        }
    },

    get viewWidth() {
        // make sure it's always positive to prevent zerodivision (and negatives)
        return Math.max(this.viewEnd - this.viewStart, 0.0001)
    },

    _timeToX(timestamp) {
        const progress = (timestamp - timelineState.viewStart) / timelineState.viewWidth
        return progress * timelineCanvas.width
    },

    _xToTime(x) {
        const progress = x / timelineCanvas.width
        return progress * (timelineState.viewWidth) + timelineState.viewStart
    },

    updateView() {
        if (timelineState.currTime > timelineState.viewEnd) {
            const increment = timelineState.viewWidth
            timelineState.viewStart += increment
            timelineState.viewEnd += increment
            timelineState.hoverTime = null
        }

        
        if (timelineState.currTime < timelineState.viewStart) {
            const increment = timelineState.viewWidth
            timelineState.viewStart -= increment
            timelineState.viewEnd -= increment
            timelineState.hoverTime = null
        }
    }
}

function videoTimeToString(totalSeconds, showMillis=false) {
    if (totalSeconds < 0) {
        return ""
    }

    totalSeconds ??= timelineState.currTime

    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0")
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0")
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0")

    let outString = undefined
    if (hours == 0) {
        outString = `${minutes}:${seconds}`
    } else {
        outString = `${hours}:${minutes}:${seconds}`
    }

    if (showMillis) {
        outString += `:${Math.round((totalSeconds % 1) * 1000).toString().padStart(3, "0")}`
    }

    return outString
}

function renderTimeline() {
    timelineCanvas.width = timelineCanvas.clientWidth
    timelineCanvas.height = timelineCanvas.clientHeight
    
    function drawMarkAtTime(time, {color="#ccc", width=1, height=1.0}={}) {
        timelineContext.beginPath()
        const x = timelineState._timeToX(time)
        timelineContext.moveTo(x, 0)
        timelineContext.lineTo(x, timelineCanvas.height * height)

        timelineContext.lineWidth = width
        timelineContext.strokeStyle = color
        timelineContext.stroke()
    }

    function drawMarkingAtTime(time) {
        const x = timelineState._timeToX(time)
        timelineContext.beginPath()
        timelineContext.arc(x, timelineCanvas.height * 0.225, timelineCanvas.height * 0.1, 0, Math.PI * 2)
        timelineContext.fillStyle = "rgba(0, 0, 255, 0.2)"
        timelineContext.fill()
    }

    // draw regular ticks
    let markInterval = 1 // 1 2 5 10 20 50 100 200 500 ...
    while (timelineCanvas.width / (timelineState.viewWidth / (markInterval / 100)) < 5) {
        const firstDigit = markInterval.toString()[0]
        if (firstDigit == "1") {
            markInterval *= 2
        } else if (firstDigit == "2") {
            markInterval = Math.round(markInterval * 2.5)
        } else { // lastDigit == "5"
            markInterval *= 2
        }
    }
    markInterval /= 100

    for (let t = Math.floor(timelineState.viewStart) - 1; t < Math.ceil(timelineState.viewEnd) + 1; t += markInterval) {
        if (t < 0.0 || (currVideoElement && t > currVideoElement.duration)) {
            continue
        }

        if ((Math.round(t * 1000) / 1000) % 1 == 0) {
            drawMarkAtTime(t, {color: "#aaa", height: 0.6})
        } else {
            drawMarkAtTime(t, {color: "#ccc", height: 0.45})
        }
    }

    drawMarkAtTime(0.0, {color: "#aaa", height: 0.6})

    // draw markings
    for (const marking of markings) {
        if (marking.timestamp < timelineState.viewStart || marking.timestamp > timelineState.viewEnd) {
            continue
        }
        drawMarkingAtTime(marking.timestamp)
    }

    // draw timestamps
    const fontSize = timelineCanvas.height * 0.2
    timelineContext.font = `${fontSize}px system-ui`
    timelineContext.fillStyle = "black"
    timelineContext.textBaseline = "middle"
    timelineContext.textAlign = "center"
    const timeStampWidth = timelineContext.measureText("00:00").width
    let lastX = -Infinity
    for (let t = Math.floor(timelineState.viewStart / 10) * 10; t < Math.ceil(timelineState.viewEnd) + 1; t++) {
        if (t < 0.0 || (currVideoElement && t > currVideoElement.duration)) {
            continue
        }

        const xPosition = timelineState._timeToX(t)
        const xDelta = xPosition - lastX
        if (xDelta > timeStampWidth * 1.2) {
            const timeString = videoTimeToString(t)
            timelineContext.fillText(timeString, xPosition, timelineCanvas.height - fontSize)
            lastX = xPosition
        }
    }

    // draw special
    drawMarkAtTime(timelineState.currTime, {color: "rgba(0, 0, 0, 0.5)", width: 3})
    if (timelineState.hoverTime !== null && timelineState.hoverTime !== timelineState.currTime) {
        drawMarkAtTime(timelineState.hoverTime, {color: "rgba(0, 0, 255, 0.5)", width: 3})
    }
}

function setNewTime(newTime, rerender=true) {
    newTime = Math.max(newTime, 0.0)
    if (currVideoElement) {
        newTime = Math.min(newTime, currVideoElement.duration)
    }

    timelineState.currTime = newTime
    if (currVideoElement) {
        currVideoElement.currentTime = newTime
        if (rerender) {
            updateVideoCanvasContent()
        }
    } else if (rerender) {
        renderTimeline()
    }
}

timelineCanvas.addEventListener("mousedown", event => {
    timelineState.mouseDown = true
    const rect = timelineCanvas.getBoundingClientRect()
    const clickedTime = timelineState._xToTime(event.clientX - rect.left)
    setNewTime(clickedTime)

    if (currVideoElement) {
        currVideoElement.pause()
    }
})

timelineCanvas.addEventListener("mouseup", event => {
    timelineState.mouseDown = false
    renderTimeline()
})

timelineCanvas.addEventListener("mousemove", event => {
    const rect = timelineCanvas.getBoundingClientRect()
    timelineState.hoverTime = timelineState._xToTime(event.clientX - rect.left)

    if (timelineState.mouseDown) {
        setNewTime(timelineState.hoverTime)
    } else {
        renderTimeline()
    }
})

setInterval(() => {
    if (!timelineState.mouseDown || timelineState.hoverTime === null) {
        return
    }

    const dragEndRelativeWidth = 0.1
    const xProgress = timelineState._timeToX(timelineState.hoverTime) / timelineCanvas.width
    let moveSpeed = 0
    if (xProgress < dragEndRelativeWidth) {
        moveSpeed = -(1 - xProgress / dragEndRelativeWidth)
    } else if (xProgress > (1 - dragEndRelativeWidth)) {
        moveSpeed = (xProgress - (1 - dragEndRelativeWidth)) / dragEndRelativeWidth
    }

    let increment = (moveSpeed ** 3) * timelineState.viewWidth * 0.3
    timelineState.viewStart += increment
    timelineState.viewEnd += increment

    timelineState.hoverTime = timelineState._xToTime(xProgress * timelineCanvas.width)
    setNewTime(timelineState.hoverTime, false)

    if (moveSpeed !== 0) {
        updateVideoCanvasContent()
    }
}, 50)

timelineCanvas.addEventListener("mouseleave", () => {
    timelineState.hoverTime = null
    timelineState.mouseDown = false
    renderTimeline()
})

timelineCanvas.addEventListener("wheel", event => {
    let increment = event.deltaX / 1000 * timelineState.viewWidth
    timelineState.viewStart += increment
    timelineState.viewEnd += increment

    let zoomFactor = -event.deltaY / 1000 + 1.0
    const newWidth = timelineState.viewWidth * zoomFactor
    if (newWidth > 1.2 && newWidth < 60 * 1000) {
        const widthDeltaHalved = (newWidth - timelineState.viewWidth) / 2
        timelineState.viewStart -= widthDeltaHalved
        timelineState.viewEnd += widthDeltaHalved
    }

    renderTimeline()
    event.preventDefault()
    timelineState.hoverTime = null
})