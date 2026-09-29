package com.debonair.iedailycontrol.data.model

enum class HourlyStatus {
    ABOVE,
    ON_TRACK,
    BELOW
}

data class HourlyOutput(
    val hourIndex: Int,
    val timeSlot: String,
    val targetUnits: Int,
    val actualUnits: Int,
    val scrapUnits: Int,
    val cumulativeTarget: Int,
    val cumulativeActual: Int,
    val delta: Int,
    val status: HourlyStatus,
    val downtimeMinutes: Int = 0,
    val notes: String? = null
)
