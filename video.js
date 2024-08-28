const videoCanvasContainer = document.querySelector(".main-container")
const videoCanvas = document.querySelector("#videoCanvas")
const videoContext = videoCanvas.getContext("2d")

let videoLoadIdCount = 0
let currVideoLoadId = 0
let currVideoElement = null

const viewCentre = {x: 0.5, y: 0.5}
let viewZoom = 1

function updateVideoCanvasContent() {
    videoContext.clearRect(0, 0, videoCanvas.width, videoCanvas.height)
    if (currVideoElement) {
        const videoWidth = videoCanvas.width / viewZoom
        const videoHeight = videoCanvas.height / viewZoom
        const startX = viewCentre.x * videoCanvas.width - videoWidth / 2
        const startY = viewCentre.y * videoCanvas.height - videoHeight / 2
        videoContext.drawImage(currVideoElement, startX, startY, videoWidth, videoHeight)
    }

    const fontSize = videoCanvas.height * 0.05
    videoContext.font = `${fontSize}px system-ui`
    videoContext.fillStyle = "white"
    videoContext.textBaseline = "top"
    videoContext.fillText(videoTimeToString(undefined, true), fontSize, fontSize)

    renderTimeline()
    renderMarkings()
    renderCountingLine()
}

function updateVideoCanvasSize({paddingPx=40}={}) {
    let aspectRatio = 16 / 9
    if (currVideoElement) {
        aspectRatio = currVideoElement.videoWidth / currVideoElement.videoHeight
    }

    const availWidth = videoCanvasContainer.clientWidth - paddingPx * 2
    const availHeight = videoCanvasContainer.clientHeight - paddingPx * 2

    if (availWidth / availHeight < aspectRatio) {
        videoCanvas.width = availWidth
        videoCanvas.height = availWidth / aspectRatio
    } else {
        videoCanvas.height = availHeight
        videoCanvas.width = availHeight * aspectRatio
    }

    updateVideoCanvasContent()
}

function uploadVideo() {
    return new Promise(async (resolve, reject) => {
        const input = document.createElement("input")
        input.setAttribute("type", "file")
        input.setAttribute("accept", "video/mp4,video/x-m4v,video/*")
        input.click()

        input.onchange = async function() {
            if (!input.value.length) {
                reject()
                return
            }

            resolve({blob: input.files[0]})
        }

        // if the body was focused again, assume the user has
        // closed the file open prompt and abort the upload.
        // > there's no official close-event fired :(
        document.body.onfocus = () => {
            setTimeout(() => {
                if (!input.value.length)
                    reject()
            }, 1000)
        }
    })
}

async function registerNewVideoSource(video, loadId) {
    let startTime = null

    function processNewFrame(now, metaData) {
        updateVideoCanvasSize()
        if (currVideoLoadId != loadId) {
            return
        }

        if (startTime === null) {
            startTime = now
        }

        timelineState.currTime = currVideoElement.currentTime
        timelineState.updateView()

        updateVideoCanvasContent()

        video.requestVideoFrameCallback(processNewFrame)
    }

    timelineState.currTime = 0.0
    timelineState.viewStart = -0.5
    timelineState.viewEnd = 10.5
    timelineState.videoSpeed = timelineState.videoSpeed

    video.requestVideoFrameCallback(processNewFrame)
    updateVideoCanvasContent()
}

async function upload() {
    const videoFile = await uploadVideo()

    if (currVideoElement) {
        currVideoElement.remove()
    }
    
    const video = document.createElement("video")
    video.style.display = "none"
    video.src = URL.createObjectURL(videoFile.blob)
    video.muted = true
    document.body.appendChild(video)

    videoCanvas.classList.add("has-video")

    currVideoElement = video
    currVideoLoadId = videoLoadIdCount++

    registerNewVideoSource(video, currVideoLoadId)
}

function playpause() {
    if (currVideoElement) {
        if (currVideoElement.paused) {
            currVideoElement.play()
        } else {
            currVideoElement.pause()
        }
    }
}

videoCanvas.addEventListener("wheel", event => {
    return // TODO
    viewZoom += event.deltaY / 1000
    viewZoom = Math.min(Math.max(0.1, viewZoom), 1)
    updateVideoCanvasContent()
})