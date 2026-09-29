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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.debonair.iedailycontrol.data.model.ActionItem
import com.debonair.iedailycontrol.data.model.ActionPriority
import com.debonair.iedailycontrol.data.model.ActionStatus
import com.debonair.iedailycontrol.ui.theme.*
import com.debonair.iedailycontrol.viewmodel.DcsViewModel

@Composable
fun ActionsScreen(viewModel: DcsViewModel) {
    val actionItems by viewModel.actionItems.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        item {
            Text(
                text = "5-WHY ROOT CAUSE & COUNTERMEASURES",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }

        items(actionItems) { action ->
            ActionCard(
                action = action,
                onToggleStatus = {
                    val nextStatus = when (action.status) {
                        ActionStatus.OPEN -> ActionStatus.IN_PROGRESS
                        ActionStatus.IN_PROGRESS -> ActionStatus.VERIFIED_CLOSED
                        ActionStatus.VERIFIED_CLOSED -> ActionStatus.OPEN
                    }
                    viewModel.updateActionStatus(action.id, nextStatus)
                }
            )
        }
    }
}

@Composable
fun ActionCard(
    action: ActionItem,
    onToggleStatus: () -> Unit
) {
    val priorityColor = when (action.priority) {
        ActionPriority.HIGH -> StatusRed
        ActionPriority.MEDIUM -> StatusAmber
        ActionPriority.LOW -> StatusBlue
    }

    val (statusColor, statusLabel) = when (action.status) {
        ActionStatus.OPEN -> StatusAmber to "OPEN"
        ActionStatus.IN_PROGRESS -> StatusBlue to "IN PROGRESS"
        ActionStatus.VERIFIED_CLOSED -> StatusGreen to "VERIFIED CLOSED"
    }

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
                            .background(priorityColor.copy(alpha = 0.2f))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = action.priority.name,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = priorityColor
                            )
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "${action.stationCode} • ${action.category}",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold)
                    )
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(statusColor.copy(alpha = 0.2f))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = statusLabel,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = statusColor
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = action.title,
                style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold)
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = action.description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f)
            )

            if (action.fiveWhys.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.surface)
                        .padding(10.dp)
                ) {
                    Text(
                        text = "5-WHY ANALYSIS CASCADE",
                        style = MaterialTheme.typography.labelSmall,
                        color = IndustrialTealLight
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    action.fiveWhys.forEach { why ->
                        Text(
                            text = "• $why",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.85f)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Countermeasure: ${action.countermeasure}",
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                color = StatusGreen
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Owner: ${action.owner} (${action.role}) | Due: ${action.dueDate}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )

                OutlinedButton(
                    onClick = onToggleStatus,
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "Next Status",
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
        }
    }
}
