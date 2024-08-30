const possibleVideoSpeeds = [0.1, 0.2, 0.3, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2, 3, 5, 10]

class Settings {
    // Singleton

    constructor() {
        this.keyValueMap = new Map()
        this.defaultsMap = new Map()
    }

    getValue(key) {
        const rawValue = this.keyValueMap.get(key)
        const isNumber = !isNaN(rawValue)
        return isNumber ? +rawValue : rawValue
    }

    setValue(key, value, {save=true}={}) {
        this.keyValueMap.set(key, value)
        if (save) {
            this.saveSetting(key)
        }
    }

    keys() {
        return Array.from(this.keyValueMap.keys())
    }

    entries() {
        return Array.from(this.keyValueMap.entries())
    }

    getLocalStorageKey(key) {
        return `c-setting-${key}`
    }

    saveSetting(key) {
        const localKey = this.getLocalStorageKey(key)
        localStorage.setItem(localKey, this.getValue(key))
    }

    loadSetting(key) {
        const localKey = this.getLocalStorageKey(key)
        const localValue = localStorage.getItem(localKey)
        const value = localValue ?? this.defaultsMap.get(key)
        this.setValue(key, value, {save: false})
    }

    loadAll() {
        for (const key of this.keys()) {
            this.loadSetting(key)
        }
    }

    addSetting(key, defaultValue) {
        this.defaultsMap.set(key, defaultValue)
        this.loadSetting(key)

        const returnObject = {
            addRangeElement: (rangeId, {rerender=true}={}) => {
                const range = document.getElementById(rangeId)
                range.value = this.getValue(key)
                range.addEventListener("input", () => {
                    this.setValue(key, range.value)
                    if (rerender) {
                        updateVideoCanvasContent()
                    }
                })
            },

            addRangeElementWithSameName: options => {
                return returnObject.addRangeElement(key, options)
            },

            addRangeContainer: (containerId, {formatString=()=>{}, values=null, setter=()=>{}}={}) => {
                const container = document.getElementById(containerId)
                const label = container.querySelector("label")
                const range = container.querySelector("input[type=\"range\"]")
                range.addEventListener("input", () => {
                    let value = range.value
                    let index = value
                    if (values !== null) {
                        value = values[index]
                    }
                    
                    if (value !== 0 && !value) return
                    label.textContent = formatString(value)
                    this.setValue(key, value)
                    setter(value)
                })

                label.textContent = formatString(this.getValue(key))
                if (values !== null) {
                    const index = values.indexOf(this.getValue(key)) ?? 0
                    this.setValue(key, values[index])
                    range.value = index
                } else {
                    range.value = this.getValue(key)
                }

                setter(this.getValue(key))
            }
        }

        return returnObject
    }

    resetAll() {
        for (const key of this.keys()) {
            const localKey = this.getLocalStorageKey(key)
            localStorage.removeItem(localKey)
        }
    }

}

const settings = new Settings()
settings.addSetting("counting-line-start-x", 0).addRangeElementWithSameName()
settings.addSetting("counting-line-start-y", 0).addRangeElementWithSameName()
settings.addSetting("counting-line-end-x", 0).addRangeElementWithSameName()
settings.addSetting("counting-line-end-y", 0).addRangeElementWithSameName()
settings.addSetting("counting-line-width", 5).addRangeElementWithSameName()

settings.addSetting("marking-size", 10).addRangeContainer("marking-size-range-container", {
    formatString: val => `Marking Size: ${val}%`,
    setter: () => updateVideoCanvasContent()
})

settings.addSetting("video-speed", 1).addRangeContainer("video-speed-range-container", {
    formatString: val => `Video Speed: ${val}x`,
    setter: val => timelineState.videoSpeed = val,
    values: possibleVideoSpeeds
})

function renderCountingLine() {
    videoContext.beginPath()
    videoContext.moveTo(
        settings.getValue("counting-line-start-x") / 100 * videoCanvas.width,
        settings.getValue("counting-line-start-y") / 100 * videoCanvas.height
    )
    videoContext.lineTo(
        settings.getValue("counting-line-end-x") / 100 * videoCanvas.width,
        settings.getValue("counting-line-end-y") / 100 * videoCanvas.height
    )
    videoContext.strokeStyle = "rgba(0, 255, 0, 0.5)"
    videoContext.lineWidth = settings.getValue("counting-line-width")
    videoContext.lineCap = "round"
    videoContext.stroke()
}

function resetAllSettings() {
    if (confirm("Do you really want to reset all Settings? This will reload the page.")) {
        settings.resetAll()
        window.location.reload()
    }
}