package org.todolist.utils;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConfig {
  private static final String JDBC_URL = "jdbc:mysql://localhost:3306/todolist";
  private static final String DB_USER = "todolist_user";
  private static final String DB_PASSWORD = "your_todolist_password";

  static {
    try {
      Class.forName("com.mysql.cj.jdbc.Driver");
    } catch (ClassNotFoundException e) {
      throw new RuntimeException("Failed to load MySQL JDBC driver", e);
    }
  }

  public static Connection getConnection() throws SQLException {
    return DriverManager.getConnection(JDBC_URL, DB_USER, DB_PASSWORD);
  }
}
