import { Component } from '@angular/core';
// import { InputsDto } from 'src/model/data';
import { Alarm, AnalogInput, DigitalInput, InputsDTO } from 'src/model/models';
import { TagService } from '../services/tag.service';

@Component({
  selector: 'app-inputs-manage',
  templateUrl: './inputs-manage.component.html',
  styleUrls: ['./inputs-manage.component.css']
})
export class InputsManageComponent {
  //globals
  isEdit: boolean = false
  Inputs: InputsDTO = {
    analogInputs: [],
    digitalInputs: []
  };
  tags: any[] = [];

  showDeleteIconAnalog: boolean[] = Array(this.Inputs.analogInputs.length).fill(false)
  showDeleteIconDigital: boolean[] = Array(this.Inputs.digitalInputs.length).fill(false)

  constructor(private tagService: TagService){
    this.connectHub();
  }

  ngOnInit(){
    this.tagService.getInputs().subscribe({
      next: (val: any) => {
        console.log(val);
        this.Inputs = val;
        this.Inputs.analogInputs.forEach(x => this.tags.push(x));
        this.Inputs.digitalInputs.forEach(x => this.tags.push(x));
        console.log(this.tags);
      },
      error: (err: any) => {
        console.log(err);
      }
    });
    
  }

  isAlarmActive(alarm: Alarm, input: AnalogInput) : boolean {
    if(!input.isOn) return false
    if(alarm.type == 0 && input.value < alarm.threshold) return true
    if(alarm.type == 1 && input.value > alarm.threshold) return true
    return false
  }

  connectHub(){
    this.tagService.startConnection()
      .then(() => {
        console.log('SignalR Simulation connection established');
      })
      .catch((error) => {
        console.error('SignalR Simulation connection error:', error);
      });
    // Handle received simulation data
    // Handle received simulation data
    this.tagService.getHubConnection().on('SendSimulationData', (data) => {
      this.handleSimulationData(data);
    });

    this.tagService.startRTU()
      .then(() => {
        console.log("SignalR RTU connection established");
      }).catch((error) => {
        console.error('SignalR RTU connection error:', error);
      });

    this.tagService.getRTU().on("SendRTUData", (data) => {
      this.handleRTU(data);
    });
  }

  handleSimulationData(data: any){
    console.log(data);
    for(let tag of this.tags){
      if(tag.ioAddress == data.address) tag.value=data.value;
    }
  }

  handleRTU(data: any){
    for (let tag of this.tags){
      if(tag.ioAddress == data.ioAddress) tag.value = data.value;
    }
  }

  //view inputs
  deleteAnalog(input: AnalogInput){

    this.tagService.deleteTag(input.id).subscribe({
      next: (val: any) =>{
        const index = this.Inputs.analogInputs.indexOf(input)
        this.Inputs.analogInputs.splice(index, 1)
      },
      error: (val: any) => {
        console.log(val.error);
      }
    })
   
  }

  deleteDigital(input: DigitalInput){
    this.tagService.deleteTag(input.id).subscribe({
      next: (val: any) =>{
        const index = this.Inputs.digitalInputs.indexOf(input)
        this.Inputs.digitalInputs.splice(index, 1)
      },
      error: (val: any) => {
        console.log(val.error);
      }
    })
    
  }

  switch(input: any){
    input.ScanOn = !input.ScanOn
  }

  //add inpts
  newAlarms: Alarm[] = []
  isAnalog: boolean = true
  //form
  name: string = ''
  address: number|undefined = undefined 
  scanTime: number|undefined = undefined
  driver: string = 'sin'
  lowLimit: number|undefined = undefined
  hightLimit: number|undefined = undefined
  unit: string = ''
  treshold: number|undefined = undefined
  alarmType: string = '0'
  alarmPriority: string = '1'

  getAddresses(): number[]{
    var addresses = []
    for(var i = 1; i < 11; i++){
      if (this.Inputs.analogInputs.some((input) => input.ioAddress == i.toString())) continue
      if(this.Inputs.digitalInputs.some((input) => input.ioAddress == i.toString())) continue
      addresses.push(i)
    }
    return addresses
  }

  addAlarm(){
    if(this.treshold == undefined) {
      alert('Threshold is empty')
      return
    }
    this.newAlarms.push(
      {
        type: parseInt(this.alarmType),
        priority: parseInt(this.alarmPriority),
        threshold: this.treshold,
        analogInputId: 0
      }
    )
  }

  isFormValid(): boolean {
    if(this.name == '' || this.address == undefined || this.scanTime == undefined) {
      alert('Some field is empty')
      return false
    }
    if(this.isAnalog && (this.lowLimit == undefined || this.hightLimit == undefined || this.unit == '')) {
      alert('Some field is empty')
      return false
    }
    return true
  }

  restartForm(){
    this.name = ''
    this.address = undefined 
    this.scanTime = undefined
    this.driver = 'sin'
    this.lowLimit = undefined
    this.hightLimit = undefined
    this.unit = ''
    this.treshold = undefined
    this.alarmType = '0'
    this.alarmPriority = '1'
    this.newAlarms = []
    this.isEdit = false
  }

  createInput() {
    if(!this.isFormValid()) return
    if(this.isAnalog) {
      var inputA: AnalogInput = {
        id: 0,
        name: this.name,
        driver: this.driver,
        ioAddress: this.address?.toString() ?? "0",
        scanTime: this.scanTime ?? 0,
        alarms: this.newAlarms,
        isOn: true,
        lowLimit: this.lowLimit ?? 0,
        highLimit: this.hightLimit ?? 0,
        units:this.unit,
        value:0
      }

      this.tagService.addAnalogInput(inputA).subscribe({
        next: (val: any) =>{
          this.Inputs.analogInputs.push(inputA)
        },
        error: (error: any)=> {
          console.log(error.error);
        } 
      })
    }
    else{
      var inputD: DigitalInput = {
        id: 1,
        name: this.name,
        driver: this.driver,
        ioAddress: this.address?.toString() ?? "0",
        scanTime: this.scanTime ?? 0,
        isOn: true
      }
      this.tagService.addDigitalInput(inputD).subscribe({
        next: (val: any) =>{
          this.Inputs.digitalInputs.push(inputD)
        },
        error: (error: any)=> {
          console.log(error.error);
        } 
      })
    }
    this.restartForm()
  }

}