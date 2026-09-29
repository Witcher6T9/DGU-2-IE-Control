package com.debonair.iedailycontrol.data.model

enum class CenterlineStatus {
    IN_SPEC,
    NEAR_LIMIT,
    OUT_OF_SPEC
}

data class CenterlineAuditItem(
    val id: String,
    val stationCode: String,
    val parameter: String,
    val lsl: Double,
    val target: Double,
    val usl: Double,
    val currentValue: Double,
    val unit: String,
    val status: CenterlineStatus,
    val lastChecked: String
)
