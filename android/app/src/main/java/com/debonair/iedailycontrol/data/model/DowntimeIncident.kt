package com.debonair.iedailycontrol.data.model

enum class LossCategory(val displayName: String) {
    BREAKDOWN("Equipment Breakdown"),
    SETUP("Setup & Adjustments"),
    IDLING("Idling & Minor Stops"),
    SPEED_LOSS("Reduced Speed"),
    DEFECTS("Process Defects / Rework"),
    STARVATION("Startup & Material Starvation")
}

data class DowntimeIncident(
    val id: String,
    val timestamp: String,
    val stationCode: String,
    val stationName: String,
    val category: LossCategory,
    val durationMinutes: Int,
    val description: String,
    val rootCause: String,
    val actionTaken: String,
    val reportedBy: String,
    val shift: String = "Shift 1"
)
