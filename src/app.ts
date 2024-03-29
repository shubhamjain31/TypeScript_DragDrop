function autobind(target: any, name: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  const newDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      return originalMethod.bind(this);
    },
  };

  return newDescriptor;
}

interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
}

// function to validate data of all input fields
function validate(validatableInput: Validatable): boolean {
  let isValid = true;

  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }

  if (
    validatableInput.minLength != null && typeof validatableInput.value === 'string'
  ) {
    isValid = isValid && validatableInput.value.length >= validatableInput.minLength;
  }

  if (
    validatableInput.maxLength != null && typeof validatableInput.value === 'string'
  ) {
    isValid = isValid && validatableInput.value.length <= validatableInput.maxLength;
  }

  if (
    validatableInput.min != null && typeof validatableInput.value === 'number'
  ) {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }

  if (
    validatableInput.max != null && typeof validatableInput.value === 'number'
  ) {
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }

  return isValid;
}

// define variable with datatype and conditions like ?(i.e, min?: number or min: number or undefined)
interface Validatable {
  value: string | number;
  required?: true;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

enum ProjectStatus {
  Active,
  Finished,
}

class Project {
  constructor(
    public id:            string,
    public title:         string,
    public description:   string,
    public people:        number,
    public status:        ProjectStatus
  ) {}
}

type Listener<T> = (projects: T[]) => void;

class State<T> {
  protected listeners: Listener<T>[] = [];
  addListener(listener: Listener<T>) {
    this.listeners.push(listener);
  }
}

class ProjectState extends State<Project> {
  private static instance: ProjectState;
  private projects: Project[] = [];

  private construtor() {}

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }

    this.instance = new ProjectState();
    return this.instance;
  }

  addProject(title: string, description: string, people: number) {
    const project = new Project(
      Math.random().toString(),
      title,
      description,
      people,
      ProjectStatus.Active
    );
    this.projects.push(project);
    this.updateListeners();
  }

  moveProject(projectId: string, newStatus: ProjectStatus) {
    const project = this.projects.find((prj) => prj.id === projectId);
    if (project && project.status !== newStatus) {
      project.status = newStatus;
      this.updateListeners();
    }
  }

  updateListeners() {
    for (const listenerFn of this.listeners) {
      listenerFn(this.projects);
    }
  }
}

const projectState = ProjectState.getInstance();

class ProjectInput {
  FormEl:         HTMLFormElement;
  titleEl:        HTMLInputElement;
  descriptionEl:  HTMLInputElement;
  peopleEl:       HTMLInputElement;
  
  constructor() {
    this.FormEl         = document.querySelector('form') as HTMLFormElement;
    this.titleEl        = document.getElementById('title') as HTMLInputElement;
    this.peopleEl       = document.getElementById('people') as HTMLInputElement;
    this.descriptionEl  = document.getElementById('description') as HTMLInputElement;

    this.configure();
  }

  private configure() {
    this.FormEl.addEventListener('submit', this.submitHandler);
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();

    // store all data in userInput variable
    const userInput = this.gatherUserInput();

    if (Array.isArray(userInput)) {
      const [title, description, people] = userInput;
      this.clearInput();

      // project added in below list
      projectState.addProject(title, description, people);
    }

    //console.log(title, description, people);
  }

  // clear input fields after form submit
  private clearInput() {
    this.titleEl.value = '';
    this.descriptionEl.value = '';
    this.peopleEl.value = '';
  }

  // get input fields data in this function
  private gatherUserInput(): [string, string, number] | void {
    const title         = this.titleEl.value;
    const description   = this.descriptionEl.value;
    const people        = +this.peopleEl.value;

    const titleValidatable: Validatable = {
      value: title,
      required: true,
    };

    const descriptionValidatable: Validatable = {
      value: description,
      required: true,
      minLength: 4,
      maxLength: 80,
    };

    const peopleValidatable: Validatable = {
      value: people,
      required: true,
      min: 1,
      max: 10,
    };

    if (!validate(titleValidatable) || !validate(descriptionValidatable) || !validate(peopleValidatable)) {
      alert('Input values are not valid');
      return;
    }
    return [title, description, people];
  }
}

class ProjectList implements DragTarget {
  assignedProjects: Project[] = [];
  ulElement: HTMLUListElement;
  constructor(private type: string) {this.ulElement = document.getElementById(`${this.type}-projects-list`) as HTMLUListElement;
    
    projectState.addListener((projects: Project[]) => {
      
      const relavantProjects = projects.filter((project) => {

        // check if status is active then data will append in active project list otherwise fininsed projects list
        if (this.type === 'active') {
          return project.status === ProjectStatus.Active;
        }
        return project.status === ProjectStatus.Finished;
      });
      
      this.assignedProjects = relavantProjects;
      this.renderProjects();
    });
    
    this.configure();
  }

  configure() {
    this.ulElement.addEventListener('dragover', this.dragOverHandler);
    this.ulElement.addEventListener('dragleave', this.dragLeaveHandler);
    this.ulElement.addEventListener('drop', this.dropHandler);
  }

  @autobind
  dragOverHandler(event: DragEvent): void {
    event.preventDefault();
    this.ulElement.classList.add('droppable');
  }

  @autobind
  dragLeaveHandler(event: DragEvent): void {
    this.ulElement.classList.remove('droppable');
  }

  @autobind
  dropHandler(event: DragEvent): void {
    if(event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
      let projectId = event.dataTransfer.getData('text/plain');
      projectState.moveProject(
        projectId,
        this.type === 'active'
          ? ProjectStatus.Active
          : ProjectStatus.Finished
      );
      this.ulElement.classList.remove('droppable');
    }
  }

  private renderProjects() {
    this.ulElement.innerHTML = '';
    for (const project of this.assignedProjects) {
      new ProjectItem(project, this.ulElement);
    }
  }
}

// all data elements of single object will be appended after creating an object
class ProjectItem implements Draggable {
  liElement: HTMLLIElement;
  constructor(private project: Project, private element: HTMLUListElement) {
    this.liElement = document.createElement('li');
    this.liElement.setAttribute('draggable', 'true');
    this.renderContent();
    this.configure();
  }

  // event listener for drag and drop(i.e., move)
  private configure() {
    this.liElement.addEventListener('dragstart', this.dragStartHandler);
    this.liElement.addEventListener('dragend', this.dragEndHandler);
  }

  @autobind
  dragStartHandler(event: DragEvent) {
    event.dataTransfer!.setData('text/plain', this.project.id);
    event.dataTransfer!.effectAllowed = 'move';
    console.log('drag start');
  }

  dragEndHandler(event: DragEvent) {
    console.log('dragend');
  }

  // check condition for single and many persons
  get person() {
    if (this.project.people === 1) {
      return '1 Person';
    }
    return `${this.project.people} Persons`;
  }

  renderContent() {
    const liData = `<h3>${this.project.title}</h3>
    <div><strong>${this.person} Assigned</strong></div>
    <div>${this.project.description}</div>`;
    this.liElement.innerHTML = liData;
    this.element.appendChild(this.liElement);
  }
}

// create an object for form save without page refresh
const projectInput          = new ProjectInput();
const activeprojectList     = new ProjectList('active');
const finishedprojectList   = new ProjectList('finished');