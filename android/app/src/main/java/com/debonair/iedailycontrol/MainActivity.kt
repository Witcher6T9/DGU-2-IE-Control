package com.debonair.iedailycontrol

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.debonair.iedailycontrol.ui.screens.*
import com.debonair.iedailycontrol.ui.theme.IEDailyControlTheme
import com.debonair.iedailycontrol.ui.theme.IndustrialTeal
import com.debonair.iedailycontrol.ui.theme.IndustrialTealDark
import com.debonair.iedailycontrol.viewmodel.DcsViewModel

enum class Screen(val title: String, val icon: ImageVector) {
    DASHBOARD("Cockpit", Icons.Default.Dashboard),
    HOURLY("Hourly", Icons.Default.Schedule),
    DOWNTIME("Downtime", Icons.Default.ReportProblem),
    CENTERLINE("Centerline", Icons.Default.Tune),
    ACTIONS("5-Why & Actions", Icons.Default.AssignmentTurnedIn)
}

class MainActivity : ComponentActivity() {
    private val viewModel: DcsViewModel by viewModels()

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            var currentScreen by remember { mutableStateOf(Screen.DASHBOARD) }

            IEDailyControlTheme(darkTheme = true) {
                Scaffold(
                    topBar = {
                        TopAppBar(
                            title = {
                                Column {
                                    Text(
                                        text = "DGU-2 IE CONTROL",
                                        style = MaterialTheme.typography.titleMedium.copy(
                                            fontWeight = FontWeight.Bold,
                                            letterSpacing = 1.sp
                                        ),
                                        color = Color.White
                                    )
                                    Text(
                                        text = "DEBONAIR INDUSTRIAL ENGINEERING • LINE 02",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color.White.copy(alpha = 0.75f)
                                    )
                                }
                            },
                            colors = TopAppBarDefaults.topAppBarColors(
                                containerColor = IndustrialTealDark
                            ),
                            actions = {
                                // Online Live Cloud Connectivity Status Pill
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFF16A34A).copy(alpha = 0.25f))
                                        .border(1.dp, Color(0xFF16A34A), RoundedCornerShape(8.dp))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            modifier = Modifier
                                                .size(6.dp)
                                                .clip(CircleShape)
                                                .background(Color(0xFF22C55E))
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = "ONLINE READY",
                                            style = MaterialTheme.typography.labelSmall.copy(
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFF86EFAC),
                                                fontSize = 9.sp
                                            )
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.width(6.dp))

                                IconButton(onClick = { /* Refresh telemetry */ }) {
                                    Icon(
                                        imageVector = Icons.Default.Refresh,
                                        contentDescription = "Refresh Cloud Telemetry",
                                        tint = Color.White
                                    )
                                }
                            }
                        )
                    },
                    bottomBar = {
                        NavigationBar(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant,
                            tonalElevation = 8.dp
                        ) {
                            Screen.values().forEach { screen ->
                                NavigationBarItem(
                                    selected = currentScreen == screen,
                                    onClick = { currentScreen = screen },
                                    icon = {
                                        Icon(
                                            imageVector = screen.icon,
                                            contentDescription = screen.title
                                        )
                                    },
                                    label = {
                                        Text(
                                            text = screen.title,
                                            style = MaterialTheme.typography.labelSmall
                                        )
                                    },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = IndustrialTeal,
                                        selectedTextColor = IndustrialTeal,
                                        indicatorColor = IndustrialTeal.copy(alpha = 0.2f)
                                    )
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        when (currentScreen) {
                            Screen.DASHBOARD -> DashboardScreen(viewModel = viewModel)
                            Screen.HOURLY -> HourlyScreen(viewModel = viewModel)
                            Screen.DOWNTIME -> DowntimeScreen(viewModel = viewModel)
                            Screen.CENTERLINE -> CenterlineScreen(viewModel = viewModel)
                            Screen.ACTIONS -> ActionsScreen(viewModel = viewModel)
                        }
                    }
                }
            }
        }
    }
}
