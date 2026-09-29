package com.debonair.iedailycontrol.data.model

enum class StationStatus(val label: String) {
    RUNNING("Running"),
    IDLE("Idle"),
    STARVED("Starved"),
    BLOCKED("Blocked"),
    FAULTED("Faulted"),
    MAINTENANCE("Maintenance")
}

data class CenterlineParameter(
    val parameter: String,
    val nominal: Double,
    val current: Double,
    val min: Double,
    val max: Double,
    val unit: String,
    val inSpec: Boolean
)

data class BreakdownTime(
    val valueAdded: Double,
    val nonValueAdded: Double,
    val waste: Double
)

data class Station(
    val id: String,
    val name: String,
    val code: String,
    val status: StationStatus,
    val cycleTime: Double,
    val targetCycleTime: Double,
    val oee: Double,
    val availability: Double,
    val performance: Double,
    val quality: Double,
    val unitsProduced: Int,
    val scrapCount: Int,
    val operator: String,
    val currentAlert: String? = null,
    val lastDowntimeReason: String? = null,
    val centerlines: List<CenterlineParameter> = emptyList(),
    val breakdownTime: BreakdownTime = BreakdownTime(14.2, 2.1, 1.7)
)
