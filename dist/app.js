"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
function autobind(target, name, descriptor) {
    const originalMethod = descriptor.value;
    const newDescriptor = {
        configurable: true,
        get() {
            return originalMethod.bind(this);
        },
    };
    return newDescriptor;
}
function validate(validatableInput) {
    let isValid = true;
    if (validatableInput.required) {
        isValid =
            isValid && validatableInput.value.toString().trim().length !== 0;
    }
    if (validatableInput.minLength != null &&
        typeof validatableInput.value === 'string') {
        isValid =
            isValid &&
                validatableInput.value.length >= validatableInput.minLength;
    }
    if (validatableInput.maxLength != null &&
        typeof validatableInput.value === 'string') {
        isValid =
            isValid &&
                validatableInput.value.length <= validatableInput.maxLength;
    }
    if (validatableInput.min != null &&
        typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value >= validatableInput.min;
    }
    if (validatableInput.max != null &&
        typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value <= validatableInput.max;
    }
    return isValid;
}
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus[ProjectStatus["Active"] = 0] = "Active";
    ProjectStatus[ProjectStatus["Finished"] = 1] = "Finished";
})(ProjectStatus || (ProjectStatus = {}));
class Project {
    constructor(id, title, description, people, status) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.people = people;
        this.status = status;
    }
}
class State {
    constructor() {
        this.listeners = [];
    }
    addListener(listener) {
        this.listeners.push(listener);
    }
}
class ProjectState extends State {
    constructor() {
        super(...arguments);
        this.projects = [];
    }
    construtor() { }
    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }
    addProject(title, description, people) {
        const project = new Project(Math.random().toString(), title, description, people, ProjectStatus.Active);
        this.projects.push(project);
        this.updateListeners();
    }
    moveProject(projectId, newStatus) {
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
    constructor() {
        this.FormEl = document.querySelector('form');
        this.titleEl = document.getElementById('title');
        this.peopleEl = document.getElementById('people');
        this.descriptionEl = document.getElementById('description');
        this.configure();
    }
    configure() {
        this.FormEl.addEventListener('submit', this.submitHandler);
    }
    submitHandler(event) {
        event.preventDefault();
        const userInput = this.gatherUserInput();
        if (Array.isArray(userInput)) {
            const [title, description, people] = userInput;
            this.clearInput();
            projectState.addProject(title, description, people);
        }
        //console.log(title, description, people);
    }
    clearInput() {
        this.titleEl.value = '';
        this.descriptionEl.value = '';
        this.peopleEl.value = '';
    }
    gatherUserInput() {
        const title = this.titleEl.value;
        const description = this.descriptionEl.value;
        const people = +this.peopleEl.value;
        const titleValidatable = {
            value: title,
            required: true,
        };
        const descriptionValidatable = {
            value: description,
            required: true,
            minLength: 4,
            maxLength: 80,
        };
        const peopleValidatable = {
            value: people,
            required: true,
            min: 1,
            max: 10,
        };
        if (!validate(titleValidatable) ||
            !validate(descriptionValidatable) ||
            !validate(peopleValidatable)) {
            alert('Input values are not valid');
            return;
        }
        return [title, description, people];
    }
}
__decorate([
    autobind
], ProjectInput.prototype, "submitHandler", null);
class ProjectList {
    constructor(type) {
        this.type = type;
        this.assignedProjects = [];
        this.ulElement = document.getElementById(`${this.type}-projects-list`);
        projectState.addListener((projects) => {
            const relavantProjects = projects.filter((project) => {
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
    dragOverHandler(event) {
        event.preventDefault();
        this.ulElement.classList.add('droppable');
    }
    dragLeaveHandler(event) {
        this.ulElement.classList.remove('droppable');
    }
    dropHandler(event) {
        if (event.dataTransfer &&
            event.dataTransfer.types[0] === 'text/plain') {
            let projectId = event.dataTransfer.getData('text/plain');
            projectState.moveProject(projectId, this.type === 'active'
                ? ProjectStatus.Active
                : ProjectStatus.Finished);
            this.ulElement.classList.remove('droppable');
        }
    }
    renderProjects() {
        this.ulElement.innerHTML = '';
        for (const project of this.assignedProjects) {
            new ProjectItem(project, this.ulElement);
        }
    }
}
__decorate([
    autobind
], ProjectList.prototype, "dragOverHandler", null);
__decorate([
    autobind
], ProjectList.prototype, "dragLeaveHandler", null);
__decorate([
    autobind
], ProjectList.prototype, "dropHandler", null);
class ProjectItem {
    constructor(project, element) {
        this.project = project;
        this.element = element;
        this.liElement = document.createElement('li');
        this.liElement.setAttribute('draggable', 'true');
        this.renderContent();
        this.configure();
    }
    configure() {
        this.liElement.addEventListener('dragstart', this.dragStartHandler);
        this.liElement.addEventListener('dragend', this.dragEndHandler);
    }
    dragStartHandler(event) {
        event.dataTransfer.setData('text/plain', this.project.id);
        event.dataTransfer.effectAllowed = 'move';
        console.log('drag start');
    }
    dragEndHandler(event) {
        console.log('dragend');
    }
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
__decorate([
    autobind
], ProjectItem.prototype, "dragStartHandler", null);
const projectInput = new ProjectInput();
const activeprojectList = new ProjectList('active');
const finishedprojectList = new ProjectList('finished');