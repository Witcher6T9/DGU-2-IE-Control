package com.debonair.iedailycontrol.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = IndustrialTealLight,
    onPrimary = DarkBackground,
    primaryContainer = IndustrialTealDark,
    onPrimaryContainer = LightBackground,
    secondary = IndustrialAmber,
    background = DarkBackground,
    surface = DarkSurface,
    surfaceVariant = DarkCard,
    onBackground = LightBackground,
    onSurface = LightBackground
)

private val LightColorScheme = lightColorScheme(
    primary = IndustrialTeal,
    onPrimary = LightBackground,
    primaryContainer = IndustrialTealLight,
    onPrimaryContainer = DarkBackground,
    secondary = IndustrialAmber,
    background = LightBackground,
    surface = LightSurface,
    surfaceVariant = LightCard,
    onBackground = DarkBackground,
    onSurface = DarkBackground
)

@Composable
fun IEDailyControlTheme(
    darkTheme: Boolean = true, // Default to dark industrial cockpit theme
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
