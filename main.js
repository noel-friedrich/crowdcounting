addEventListener("resize", updateVideoCanvasSize)
videoCanvas.addEventListener("click", () => {
    if (!currVideoElement) upload()
})

addEventListener("keydown", event => {
    if (event.key == " ") {
        playpause()
        event.preventDefault()
    }

    if (event.ctrlKey) {
        if (event.key == "ArrowLeft") {
            videoCanvasOffset.x -= 0.05
            updateVideoCanvasSize()
            updateVideoCanvasContent()
            event.preventDefault()
        } else if (event.key == "ArrowRight") {
            videoCanvasOffset.x += 0.05
            updateVideoCanvasSize()
            updateVideoCanvasContent()
            event.preventDefault()
        } else if (event.key == "ArrowUp") {
            videoCanvasOffset.y -= 0.05
            updateVideoCanvasSize()
            updateVideoCanvasContent()
            event.preventDefault()
        } else if (event.key == "ArrowDown") {
            videoCanvasOffset.y += 0.05
            updateVideoCanvasSize()
            updateVideoCanvasContent()
            event.preventDefault()
        } else if (event.key == "+") {
            viewZoom = Math.min(Math.max(0.1, viewZoom - 0.05), 1)
            updateVideoCanvasSize()
            updateVideoCanvasContent()
            event.preventDefault()
        } else if (event.key == "-") {
            viewZoom = Math.min(Math.max(0.1, viewZoom + 0.05), 1)
            updateVideoCanvasSize()
            updateVideoCanvasContent()
            event.preventDefault()
        }
    } else {
        if (event.key == "ArrowLeft") {
            setNewTime(timelineState.currTime - 0.1)
        } else if (event.key == "ArrowRight") {
            setNewTime(timelineState.currTime + 0.1)
        }
    }

    if (event.ctrlKey && event.key == "z") {
        deleteLastMarking()
    }
})

function main() {
    updateVideoCanvasSize()
}

main()