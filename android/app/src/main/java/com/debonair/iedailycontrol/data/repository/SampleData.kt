package com.debonair.iedailycontrol.data.repository

import com.debonair.iedailycontrol.data.model.*

object SampleData {
    val stations = listOf(
        Station(
            id = "st-01",
            name = "Infeed & Laser Barcode Reader",
            code = "ST-01",
            status = StationStatus.RUNNING,
            cycleTime = 16.8,
            targetCycleTime = 18.0,
            oee = 91.2,
            availability = 96.0,
            performance = 98.1,
            quality = 96.8,
            unitsProduced = 1420,
            scrapCount = 12,
            operator = "K. Vance (Tech 2)",
            currentAlert = null,
            centerlines = listOf(
                CenterlineParameter("Optical Belt Tension", 14.5, 14.7, 13.0, 16.0, "N", true),
                CenterlineParameter("Scan Gate Focal Clearance", 45.0, 44.8, 42.0, 48.0, "mm", true)
            )
        ),
        Station(
            id = "st-02",
            name = "Dual Servo Pick & Place",
            code = "ST-02",
            status = StationStatus.RUNNING,
            cycleTime = 17.4,
            targetCycleTime = 18.0,
            oee = 88.4,
            availability = 93.5,
            performance = 96.6,
            quality = 98.0,
            unitsProduced = 1395,
            scrapCount = 8,
            operator = "M. Chen (Tech 1)",
            centerlines = listOf(
                CenterlineParameter("Vacuum Cup Pressure", -85.0, -84.2, -90.0, -78.0, "kPa", true),
                CenterlineParameter("Z-Axis Placement Force", 32.0, 32.8, 28.0, 36.0, "N", true)
            )
        ),
        Station(
            id = "st-03",
            name = "Ultrasonic Micro-Welding Rig",
            code = "ST-03",
            status = StationStatus.FAULTED,
            cycleTime = 22.1,
            targetCycleTime = 18.0,
            oee = 68.2,
            availability = 76.0,
            performance = 91.0,
            quality = 98.5,
            unitsProduced = 1180,
            scrapCount = 31,
            operator = "R. Gomez (Lead Operator)",
            currentAlert = "Horn amplitude impedance exceeded threshold by 12%",
            lastDowntimeReason = "Resonance tuning shift on Booster 2",
            centerlines = listOf(
                CenterlineParameter("Weld Energy Delivery", 240.0, 248.5, 230.0, 250.0, "J", true),
                CenterlineParameter("Horn Clamping Force", 520.0, 560.0, 490.0, 550.0, "N", false)
            )
        ),
        Station(
            id = "st-04",
            name = "Optical Dimensioning & Vision Inspection",
            code = "ST-04",
            status = StationStatus.STARVED,
            cycleTime = 15.2,
            targetCycleTime = 18.0,
            oee = 82.5,
            availability = 86.0,
            performance = 98.0,
            quality = 98.0,
            unitsProduced = 1175,
            scrapCount = 14,
            operator = "L. Jenkins (Vision Specialist)",
            currentAlert = "Infeed queue empty due to ST-03 stoppage",
            centerlines = listOf(
                CenterlineParameter("Coaxial Strobe Illumination", 850.0, 852.0, 820.0, 880.0, "lux", true),
                CenterlineParameter("Telecentric Lens Aperture", 4.0, 4.0, 3.8, 4.2, "f/#", true)
            )
        ),
        Station(
            id = "st-05",
            name = "Laser Serialization & Final Test",
            code = "ST-05",
            status = StationStatus.RUNNING,
            cycleTime = 17.9,
            targetCycleTime = 18.0,
            oee = 92.4,
            availability = 97.2,
            performance = 96.0,
            quality = 99.1,
            unitsProduced = 1160,
            scrapCount = 5,
            operator = "D. Okonjo (QA Lead)",
            centerlines = listOf(
                CenterlineParameter("Laser Wattage Peak", 30.0, 30.1, 28.5, 31.5, "W", true),
                CenterlineParameter("Fume Extractor Flow", 185.0, 182.0, 160.0, 210.0, "m3/h", true)
            )
        ),
        Station(
            id = "st-06",
            name = "Automated Tray Packer & Outfeed",
            code = "ST-06",
            status = StationStatus.RUNNING,
            cycleTime = 17.1,
            targetCycleTime = 18.0,
            oee = 90.0,
            availability = 95.0,
            performance = 96.5,
            quality = 98.2,
            unitsProduced = 1155,
            scrapCount = 2,
            operator = "A. Miller (Operator)",
            centerlines = listOf(
                CenterlineParameter("Magazine Pusher Torque", 4.2, 4.1, 3.8, 4.6, "Nm", true)
            )
        )
    )

    val hourlyOutputs = listOf(
        HourlyOutput(1, "06:00 - 07:00", 200, 204, 3, 200, 204, 4, HourlyStatus.ABOVE),
        HourlyOutput(2, "07:00 - 08:00", 200, 198, 2, 400, 402, 2, HourlyStatus.ON_TRACK),
        HourlyOutput(3, "08:00 - 09:00", 200, 208, 4, 600, 610, 10, HourlyStatus.ABOVE),
        HourlyOutput(4, "09:00 - 10:00", 200, 142, 18, 800, 752, -48, HourlyStatus.BELOW, 18, "ST-03 Ultrasonic horn tuning deviation"),
        HourlyOutput(5, "10:00 - 11:00", 200, 175, 6, 1000, 927, -73, HourlyStatus.BELOW, 7, "Ramp up after tooling adjustment"),
        HourlyOutput(6, "11:00 - 12:00", 200, 205, 2, 1200, 1132, -68, HourlyStatus.ABOVE),
        HourlyOutput(7, "12:00 - 13:00", 200, 196, 4, 1400, 1328, -72, HourlyStatus.ON_TRACK),
        HourlyOutput(8, "13:00 - 14:00", 200, 202, 1, 1600, 1530, -70, HourlyStatus.ABOVE)
    )

    val downtimeIncidents = listOf(
        DowntimeIncident(
            id = "dt-01",
            timestamp = "09:14",
            stationCode = "ST-03",
            stationName = "Ultrasonic Micro-Welding Rig",
            category = LossCategory.BREAKDOWN,
            durationMinutes = 18,
            description = "Acoustic horn resonance error during weld cycle #142",
            rootCause = "Lock-nut torque loosened from 45 Nm to 22 Nm over 3 shifts of cyclic vibration",
            actionTaken = "Torqued to specification (48 Nm) with Nord-Lock washers; retuned frequency to 20.04 kHz",
            reportedBy = "K. Vance"
        ),
        DowntimeIncident(
            id = "dt-02",
            timestamp = "07:42",
            stationCode = "ST-02",
            stationName = "Dual Servo Pick & Place",
            category = LossCategory.IDLING,
            durationMinutes = 6,
            description = "Vacuum suction cup mis-pick detection on carrier 14",
            rootCause = "Rubber lip worn on suction head #3 causing micro air leakage",
            actionTaken = "Replaced vacuum suction cup #3 with high-durability fluoroelastomer cup",
            reportedBy = "M. Chen"
        ),
        DowntimeIncident(
            id = "dt-03",
            timestamp = "10:25",
            stationCode = "ST-04",
            stationName = "Optical Vision Inspection",
            category = LossCategory.STARVATION,
            durationMinutes = 7,
            description = "Infeed buffer emptied following upstream weld stall",
            rootCause = "ST-03 bottleneck propagated through conveyor buffer zone 2",
            actionTaken = "Swapped in 25-piece offline pre-weld buffer rack to replenish vision queue",
            reportedBy = "L. Jenkins"
        )
    )

    val actionItems = listOf(
        ActionItem(
            id = "act-01",
            title = "Install Nord-Lock Washers on ST-03 Horn Mount",
            stationCode = "ST-03",
            owner = "K. Vance",
            role = "Maintenance Tech 2",
            priority = ActionPriority.HIGH,
            status = ActionStatus.VERIFIED_CLOSED,
            dueDate = "Today 12:00",
            createdDate = "09:30",
            category = "Maintenance",
            description = "Prevent acoustic resonance loosening under high-duty cycle ultrasonic welding",
            fiveWhys = listOf(
                "Why did line stop? ST-03 stopped on horn amplitude fault.",
                "Why amplitude fault? Acoustic impedance shifted out of generator lock range.",
                "Why impedance shift? Booster interface lock nut backed off.",
                "Why backed off? Standard split washers flattened under cyclic vibration.",
                "Root cause: Lack of vibration-proof positive locking fasteners on acoustic stack."
            ),
            countermeasure = "Standardize Nord-Lock wedge-locking washers on all 6 welding fixtures across Lines 1-4."
        ),
        ActionItem(
            id = "act-02",
            title = "Calibrate ST-04 Vision Strobe Illumination",
            stationCode = "ST-04",
            owner = "L. Jenkins",
            role = "Vision Engineer",
            priority = ActionPriority.MEDIUM,
            status = ActionStatus.IN_PROGRESS,
            dueDate = "Today 16:00",
            createdDate = "10:15",
            category = "Quality",
            description = "Ambient sunlight through skylight causes 4% false reject rate between 11:30 and 13:30",
            countermeasure = "Install matte black shroud extension and switch trigger mode to pulsed high-intensity flash."
        ),
        ActionItem(
            id = "act-03",
            title = "Preventative Replacement of ST-02 Vacuum Cups",
            stationCode = "ST-02",
            owner = "M. Chen",
            role = "Automation Tech 1",
            priority = ActionPriority.LOW,
            status = ActionStatus.OPEN,
            dueDate = "Tomorrow 06:00",
            createdDate = "08:10",
            category = "Efficiency",
            description = "Add 150,000-cycle PM trigger in DCS CMMS for pick & place gripper tips",
            countermeasure = "Integrate cycle count trigger directly into DCS station health telemetry."
        )
    )

    val centerlines = listOf(
        CenterlineAuditItem("cl-01", "ST-01", "Infeed Belt Tension", 13.0, 14.5, 16.0, 14.7, "N", CenterlineStatus.IN_SPEC, "07:30"),
        CenterlineAuditItem("cl-02", "ST-02", "Vacuum Gripper Pressure", -90.0, -85.0, -78.0, -84.2, "kPa", CenterlineStatus.IN_SPEC, "08:00"),
        CenterlineAuditItem("cl-03", "ST-03", "Horn Clamping Force", 490.0, 520.0, 550.0, 560.0, "N", CenterlineStatus.OUT_OF_SPEC, "09:15"),
        CenterlineAuditItem("cl-04", "ST-03", "Weld Energy Delivery", 230.0, 240.0, 250.0, 248.5, "J", CenterlineStatus.NEAR_LIMIT, "09:15"),
        CenterlineAuditItem("cl-05", "ST-04", "Vision Strobe Lux", 820.0, 850.0, 880.0, 852.0, "lux", CenterlineStatus.IN_SPEC, "08:30"),
        CenterlineAuditItem("cl-06", "ST-05", "Laser Wattage Peak", 28.5, 30.0, 31.5, 30.1, "W", CenterlineStatus.IN_SPEC, "09:00"),
        CenterlineAuditItem("cl-07", "ST-06", "Pusher Arm Torque", 3.8, 4.2, 4.6, 4.1, "Nm", CenterlineStatus.IN_SPEC, "09:30")
    )
}
