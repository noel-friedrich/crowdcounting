addEventListener("resize", updateVideoCanvasSize)
videoCanvas.addEventListener("click", () => {
    if (!currVideoElement) upload()
})

addEventListener("keydown", event => {
    if (event.key == " ") {
        playpause()
        event.preventDefault()
    }

    if (event.key == "ArrowLeft") {
        setNewTime(timelineState.currTime - 0.1)
    } else if (event.key == "ArrowRight") {
        setNewTime(timelineState.currTime + 0.1)
    }

    if (event.ctrlKey && event.key == "z") {
        deleteLastMarking()
    }
})

function main() {
    updateVideoCanvasSize()
}

main()