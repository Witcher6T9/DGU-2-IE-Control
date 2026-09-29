package com.debonair.iedailycontrol.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.debonair.iedailycontrol.data.model.*
import com.debonair.iedailycontrol.data.repository.DcsRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn

class DcsViewModel(
    private val repository: DcsRepository = DcsRepository()
) : ViewModel() {

    val stations: StateFlow<List<Station>> = repository.stations
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val hourlyOutputs: StateFlow<List<HourlyOutput>> = repository.hourlyOutputs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val downtimeIncidents: StateFlow<List<DowntimeIncident>> = repository.downtimeIncidents
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val actionItems: StateFlow<List<ActionItem>> = repository.actionItems
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val centerlines: StateFlow<List<CenterlineAuditItem>> = repository.centerlines
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun toggleStationStatus(stationId: String, currentStatus: StationStatus) {
        val nextStatus = when (currentStatus) {
            StationStatus.RUNNING -> StationStatus.IDLE
            StationStatus.IDLE -> StationStatus.RUNNING
            StationStatus.FAULTED -> StationStatus.MAINTENANCE
            StationStatus.MAINTENANCE -> StationStatus.RUNNING
            else -> StationStatus.RUNNING
        }
        repository.updateStationStatus(stationId, nextStatus)
    }

    fun addDowntimeIncident(incident: DowntimeIncident) {
        repository.addDowntimeIncident(incident)
    }

    fun updateActionStatus(actionId: String, status: ActionStatus) {
        repository.updateActionStatus(actionId, status)
    }

    fun logCenterlineAudit(auditId: String, value: Double) {
        repository.logCenterlineAudit(auditId, value)
    }
}
