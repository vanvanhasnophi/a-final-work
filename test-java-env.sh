#!/bin/bash

echo "=== Java Environment Test ==="
echo "JAVA_HOME: $JAVA_HOME"
echo "PATH: $PATH"
echo ""
echo "Java version:"
java -version
echo ""
echo "Maven version:"
mvn -version
echo ""
echo "Testing Maven compile:"
mvn clean compile 