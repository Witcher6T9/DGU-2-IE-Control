package com.debonair.iedailycontrol.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.debonair.iedailycontrol.data.model.StationStatus
import com.debonair.iedailycontrol.ui.theme.*

@Composable
fun KpiMetricCard(
    title: String,
    value: String,
    subValue: String,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        shape = RoundedCornerShape(12.dp),
        border = CardDefaults.outlinedCardBorder()
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            Text(
                text = title.uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                letterSpacing = 0.5.sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                ),
                color = accentColor
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = subValue,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )
        }
    }
}

@Composable
fun StationStatusChip(status: StationStatus) {
    val (bgColor, textColor) = when (status) {
        StationStatus.RUNNING -> StatusGreen.copy(alpha = 0.2f) to StatusGreen
        StationStatus.IDLE -> StatusAmber.copy(alpha = 0.2f) to StatusAmber
        StationStatus.STARVED -> StatusBlue.copy(alpha = 0.2f) to StatusBlue
        StationStatus.BLOCKED -> IndustrialAmber.copy(alpha = 0.2f) to IndustrialAmber
        StationStatus.FAULTED -> StatusRed.copy(alpha = 0.2f) to StatusRed
        StationStatus.MAINTENANCE -> Color(0xFF9333EA).copy(alpha = 0.2f) to Color(0xFFC084FC)
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(bgColor)
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = status.label.uppercase(),
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = textColor
        )
    }
}

@Composable
fun ShiftHeaderBanner(
    lineName: String = "Line 02 - High Precision Assembly",
    shiftName: String = "Shift 1 (06:00 - 14:00)",
    supervisor: String = "A. Hossain (IE Lead)"
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = IndustrialTealDark.copy(alpha = 0.4f)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = lineName,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = Color.White
                )
                Text(
                    text = "$shiftName • Supv: $supervisor",
                    style = MaterialTheme.typography.bodyMedium,
                    color = IndustrialTealLight
                )
            }
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(StatusGreen.copy(alpha = 0.25f))
                    .border(1.dp, StatusGreen, RoundedCornerShape(8.dp))
                    .padding(horizontal = 10.dp, vertical = 6.dp)
            ) {
                Text(
                    text = "LIVE ACTIVE",
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                    color = StatusGreen
                )
            }
        }
    }
}
