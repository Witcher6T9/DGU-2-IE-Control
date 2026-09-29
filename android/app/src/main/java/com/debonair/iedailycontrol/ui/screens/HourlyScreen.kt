package com.debonair.iedailycontrol.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import com.debonair.iedailycontrol.data.model.HourlyOutput
import com.debonair.iedailycontrol.data.model.HourlyStatus
import com.debonair.iedailycontrol.ui.theme.*
import com.debonair.iedailycontrol.viewmodel.DcsViewModel

@Composable
fun HourlyScreen(viewModel: DcsViewModel) {
    val hourlyOutputs by viewModel.hourlyOutputs.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        item {
            Text(
                text = "HOURLY PRODUCTION PACING & TRACKING",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }

        items(hourlyOutputs) { slot ->
            HourlySlotCard(slot = slot)
        }
    }
}

@Composable
fun HourlySlotCard(slot: HourlyOutput) {
    val statusColor = when (slot.status) {
        HourlyStatus.ABOVE -> StatusGreen
        HourlyStatus.ON_TRACK -> IndustrialTealLight
        HourlyStatus.BELOW -> StatusRed
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(10.dp),
        border = CardDefaults.outlinedCardBorder()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Hour ${slot.hourIndex}: ${slot.timeSlot}",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold)
                )

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(statusColor.copy(alpha = 0.2f))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = if (slot.delta >= 0) "+${slot.delta} units" else "${slot.delta} units",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = statusColor
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Progress Bar: Actual vs Target
            val progress = (slot.actualUnits.toFloat() / slot.targetUnits.toFloat()).coerceIn(0f, 1.5f)
            LinearProgressIndicator(
                progress = { (progress / 1.2f).coerceIn(0f, 1f) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = statusColor,
                trackColor = MaterialTheme.colorScheme.surface
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Actual: ${slot.actualUnits} / Tgt: ${slot.targetUnits}",
                    style = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.Monospace)
                )
                Text(
                    text = "Cum: ${slot.cumulativeActual} / ${slot.cumulativeTarget}",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                )
            }

            slot.notes?.let { note ->
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "⚠️ $note (Downtime: ${slot.downtimeMinutes}m)",
                    style = MaterialTheme.typography.bodyMedium,
                    color = StatusAmber
                )
            }
        }
    }
}
