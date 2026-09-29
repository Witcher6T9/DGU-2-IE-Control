package com.debonair.iedailycontrol.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.debonair.iedailycontrol.data.model.DowntimeIncident
import com.debonair.iedailycontrol.ui.theme.*
import com.debonair.iedailycontrol.viewmodel.DcsViewModel

@Composable
fun DowntimeScreen(viewModel: DcsViewModel) {
    val downtimeIncidents by viewModel.downtimeIncidents.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        item {
            Text(
                text = "DOWNTIME LOG & ROOT CAUSE TRACKING",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }

        items(downtimeIncidents) { incident ->
            DowntimeCard(incident = incident)
        }
    }
}

@Composable
fun DowntimeCard(incident: DowntimeIncident) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(12.dp),
        border = CardDefaults.outlinedCardBorder()
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
                            .background(StatusRed.copy(alpha = 0.2f))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "${incident.durationMinutes} MIN",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = StatusRed
                            )
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "${incident.stationCode} • ${incident.timestamp}",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold)
                    )
                }

                Text(
                    text = incident.category.displayName,
                    style = MaterialTheme.typography.labelSmall,
                    color = IndustrialTealLight
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = incident.description,
                style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium)
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "Root Cause: ${incident.rootCause}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f)
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Action: ${incident.actionTaken}",
                style = MaterialTheme.typography.bodyMedium,
                color = StatusGreen
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Reported by: ${incident.reportedBy} (${incident.shift})",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
            )
        }
    }
}
