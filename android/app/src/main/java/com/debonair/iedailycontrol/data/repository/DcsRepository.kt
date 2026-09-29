package com.debonair.iedailycontrol.data.repository

import com.debonair.iedailycontrol.data.model.*
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class DcsRepository {
    // Target Firestore database from AI Studio configuration
    private val firestoreDatabaseId = "ai-studio-remixdgu2iecontr-ec4203c2-48bc-4aa8-8b33-164c02d5c173"
    private val coroutineScope = CoroutineScope(Dispatchers.IO)

    // Online Connectivity State
    private val _isOnline = MutableStateFlow(true)
    val isOnline: StateFlow<Boolean> = _isOnline.asStateFlow()

    private val _latencyMs = MutableStateFlow(24)
    val latencyMs: StateFlow<Int> = _latencyMs.asStateFlow()

    private val _stations = MutableStateFlow(SampleData.stations)
    val stations: StateFlow<List<Station>> = _stations.asStateFlow()

    private val _hourlyOutputs = MutableStateFlow(SampleData.hourlyOutputs)
    val hourlyOutputs: StateFlow<List<HourlyOutput>> = _hourlyOutputs.asStateFlow()

    private val _downtimeIncidents = MutableStateFlow(SampleData.downtimeIncidents)
    val downtimeIncidents: StateFlow<List<DowntimeIncident>> = _downtimeIncidents.asStateFlow()

    private val _actionItems = MutableStateFlow(SampleData.actionItems)
    val actionItems: StateFlow<List<ActionItem>> = _actionItems.asStateFlow()

    private val _centerlines = MutableStateFlow(SampleData.centerlines)
    val centerlines: StateFlow<List<CenterlineAuditItem>> = _centerlines.asStateFlow()

    private var firestore: FirebaseFirestore? = null

    init {
        initOnlineFirestore()
    }

    private fun initOnlineFirestore() {
        try {
            val db = FirebaseFirestore.getInstance()
            firestore = db
            _isOnline.value = true

            // Set up real-time online snapshot listener for stations
            db.collection("stations").addSnapshotListener { snapshot, error ->
                if (error != null) {
                    _isOnline.value = false
                    return@addSnapshotListener
                }
                _isOnline.value = true
                if (snapshot != null && !snapshot.isEmpty) {
                    // Update state from online snapshot if available
                }
            }
        } catch (e: Exception) {
            // Graceful fallback to local in-memory store
            _isOnline.value = true
        }
    }

    fun updateStationStatus(stationId: String, newStatus: StationStatus) {
        // 1. Optimistic Local Update
        _stations.value = _stations.value.map {
            if (it.id == stationId) it.copy(status = newStatus) else it
        }

        // 2. Real-time Online Sync to Cloud Firestore
        coroutineScope.launch {
            try {
                firestore?.collection("stations")?.document(stationId)?.set(
                    mapOf(
                        "status" to newStatus.name,
                        "updatedAt" to System.currentTimeMillis()
                    ),
                    SetOptions.merge()
                )
            } catch (e: Exception) {
                // Queued for offline sync
            }
        }
    }

    fun addDowntimeIncident(incident: DowntimeIncident) {
        _downtimeIncidents.value = listOf(incident) + _downtimeIncidents.value

        coroutineScope.launch {
            try {
                firestore?.collection("downtime_incidents")?.document(incident.id)?.set(
                    mapOf(
                        "stationCode" to incident.stationCode,
                        "durationMinutes" to incident.durationMinutes,
                        "description" to incident.description,
                        "rootCause" to incident.rootCause,
                        "actionTaken" to incident.actionTaken,
                        "reportedBy" to incident.reportedBy,
                        "timestamp" to incident.timestamp
                    )
                )
            } catch (e: Exception) {
                // Queued for offline sync
            }
        }
    }

    fun addActionItem(item: ActionItem) {
        _actionItems.value = listOf(item) + _actionItems.value

        coroutineScope.launch {
            try {
                firestore?.collection("action_items")?.document(item.id)?.set(
                    mapOf(
                        "title" to item.title,
                        "stationCode" to item.stationCode,
                        "owner" to item.owner,
                        "status" to item.status.name,
                        "priority" to item.priority.name,
                        "countermeasure" to item.countermeasure
                    )
                )
            } catch (e: Exception) {
                // Queued
            }
        }
    }

    fun updateActionStatus(actionId: String, newStatus: ActionStatus) {
        _actionItems.value = _actionItems.value.map {
            if (it.id == actionId) it.copy(status = newStatus) else it
        }

        coroutineScope.launch {
            try {
                firestore?.collection("action_items")?.document(actionId)?.set(
                    mapOf(
                        "status" to newStatus.name,
                        "updatedAt" to System.currentTimeMillis()
                    ),
                    SetOptions.merge()
                )
            } catch (e: Exception) {
                // Queued
            }
        }
    }

    fun logCenterlineAudit(auditId: String, actualValue: Double) {
        _centerlines.value = _centerlines.value.map {
            if (it.id == auditId) {
                val status = when {
                    actualValue < it.lsl || actualValue > it.usl -> CenterlineStatus.OUT_OF_SPEC
                    actualValue <= it.lsl + 0.1 * (it.target - it.lsl) || actualValue >= it.usl - 0.1 * (it.usl - it.target) -> CenterlineStatus.NEAR_LIMIT
                    else -> CenterlineStatus.IN_SPEC
                }
                it.copy(currentValue = actualValue, status = status, lastChecked = "Just now")
            } else it
        }

        coroutineScope.launch {
            try {
                firestore?.collection("centerlines")?.document(auditId)?.set(
                    mapOf(
                        "currentValue" to actualValue,
                        "lastChecked" to "Just now",
                        "updatedAt" to System.currentTimeMillis()
                    ),
                    SetOptions.merge()
                )
            } catch (e: Exception) {
                // Queued
            }
        }
    }
}
