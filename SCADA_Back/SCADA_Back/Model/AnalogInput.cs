﻿using System.ComponentModel.DataAnnotations;

namespace SCADA_Back.Model
{
	public class AnalogInput : Tag
	{
		public string Driver { get; set; }
		public double ScanTime { get; set; }
		public List<Alarm> Alarms { get; set; } = new List<Alarm>();
		public bool IsOn { get; set; }
		public double LowLimit { get; set; }
		public double HighLimit { get; set; }
		public string Units { get; set; }
	}
}
