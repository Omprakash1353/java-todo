package org.todolist.model;

public class Todo {
  private String id;
  private String title;
  private String description;
  private boolean completed;
  private int position;

  public Todo() {
  }

  public Todo(String id, String title, String description, boolean completed, int position) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.completed = completed;
    this.position = position;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public boolean isCompleted() {
    return completed;
  }

  public void setCompleted(boolean completed) {
    this.completed = completed;
  }

  public int getPosition() {
    return position;
  }

  public void setPosition(int position) {
    this.position = position;
  }
}