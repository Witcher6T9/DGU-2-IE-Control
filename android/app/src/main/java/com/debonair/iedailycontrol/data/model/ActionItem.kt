package com.debonair.iedailycontrol.data.model

enum class ActionPriority {
    HIGH,
    MEDIUM,
    LOW
}

enum class ActionStatus {
    OPEN,
    IN_PROGRESS,
    VERIFIED_CLOSED
}

data class ActionItem(
    val id: String,
    val title: String,
    val stationCode: String,
    val owner: String,
    val role: String,
    val priority: ActionPriority,
    val status: ActionStatus,
    val dueDate: String,
    val createdDate: String,
    val category: String,
    val description: String,
    val fiveWhys: List<String> = emptyList(),
    val countermeasure: String
)
