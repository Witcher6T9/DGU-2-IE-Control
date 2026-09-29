package com.debonair.iedailycontrol.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.debonair.iedailycontrol.data.model.Station
import com.debonair.iedailycontrol.data.model.StationStatus
import com.debonair.iedailycontrol.ui.components.KpiMetricCard
import com.debonair.iedailycontrol.ui.components.ShiftHeaderBanner
import com.debonair.iedailycontrol.ui.components.StationStatusChip
import com.debonair.iedailycontrol.ui.theme.*
import com.debonair.iedailycontrol.viewmodel.DcsViewModel

@Composable
fun DashboardScreen(viewModel: DcsViewModel) {
    val stations by viewModel.stations.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        item {
            ShiftHeaderBanner()
        }

        item {
            // 4 KPI Cards Grid
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    KpiMetricCard(
                        title = "Shift OEE",
                        value = "86.4%",
                        subValue = "Target: 88.0% (-1.6%)",
                        accentColor = IndustrialTealLight,
                        modifier = Modifier.weight(1f)
                    )
                    KpiMetricCard(
                        title = "Net Output",
                        value = "1,530",
                        subValue = "Target: 1,600 (-70 u)",
                        accentColor = IndustrialAmber,
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    KpiMetricCard(
                        title = "Scrap Rate",
                        value = "1.42%",
                        subValue = "72 units defect",
                        accentColor = StatusRed,
                        modifier = Modifier.weight(1f)
                    )
                    KpiMetricCard(
                        title = "Downtime",
                        value = "31 min",
                        subValue = "3 events (1 major)",
                        accentColor = StatusAmber,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        item {
            Text(
                text = "PRODUCTION STATIONS & LINE BALANCE",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        items(stations) { station ->
            StationCard(
                station = station,
                onToggleStatus = {
                    viewModel.toggleStationStatus(station.id, station.status)
                }
            )
        }
    }
}

@Composable
fun StationCard(
    station: Station,
    onToggleStatus: () -> Unit
) {
    val isBottleneck = station.code == "ST-03"
    val borderColor = if (station.status == StationStatus.FAULTED) StatusRed else MaterialTheme.colorScheme.outlineVariant

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = if (isBottleneck || station.status == StationStatus.FAULTED) 1.5.dp else 1.dp,
                color = borderColor,
                shape = RoundedCornerShape(12.dp)
            ),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(IndustrialTealDark)
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = station.code,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = station.name,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                StationStatusChip(status = station.status)
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Metrics row: Cycle Time, OEE, Units
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "CYCLE TIME",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                    Text(
                        text = "${station.cycleTime}s / ${station.targetCycleTime}s",
                        style = MaterialTheme.typography.bodyLarge.copy(
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.SemiBold
                        ),
                        color = if (station.cycleTime > station.targetCycleTime) StatusRed else StatusGreen
                    )
                }
                Column {
                    Text(
                        text = "STATION OEE",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                    Text(
                        text = "${station.oee}%",
                        style = MaterialTheme.typography.bodyLarge.copy(
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.SemiBold
                        ),
                        color = IndustrialTealLight
                    )
                }
                Column {
                    Text(
                        text = "GOOD / SCRAP",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                    Text(
                        text = "${station.unitsProduced} / ${station.scrapCount}",
                        style = MaterialTheme.typography.bodyLarge.copy(
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.SemiBold
                        ),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            station.currentAlert?.let { alert ->
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(6.dp))
                        .background(StatusRed.copy(alpha = 0.15f))
                        .padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = "Alert",
                        tint = StatusRed,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = alert,
                        style = MaterialTheme.typography.bodyMedium,
                        color = StatusRed
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Op: ${station.operator}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )

                OutlinedButton(
                    onClick = onToggleStatus,
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "Toggle State",
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
        }
    }
}
