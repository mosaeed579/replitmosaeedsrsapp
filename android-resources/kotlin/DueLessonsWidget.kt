package com.medstudy.srs

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.app.PendingIntent

class DueLessonsWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Widget added for the first time
    }

    override fun onDisabled(context: Context) {
        // Last widget removed
    }

    companion object {
        private const val CAPACITOR_PREFS = "CapacitorStorage"
        
        internal fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_due_lessons)
            
            // Get data from Capacitor SharedPreferences
            val prefs = context.getSharedPreferences(CAPACITOR_PREFS, Context.MODE_PRIVATE)
            val dueCount = prefs.getString("MedStudyWidget_due_lessons_count", "0")?.toIntOrNull() ?: 0
            val missedCount = prefs.getString("MedStudyWidget_missed_lessons_count", "0")?.toIntOrNull() ?: 0
            val totalDue = dueCount + missedCount
            
            views.setTextViewText(R.id.widget_count, totalDue.toString())
            
            val subtitle = when {
                totalDue == 0 -> "All caught up!"
                totalDue == 1 -> "lesson to review"
                else -> "lessons to review"
            }
            views.setTextViewText(R.id.widget_subtitle, subtitle)
            
            // Create intent to open app when widget is clicked
            val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                val pendingIntent = PendingIntent.getActivity(
                    context,
                    0,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_count, pendingIntent)
            }
            
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
