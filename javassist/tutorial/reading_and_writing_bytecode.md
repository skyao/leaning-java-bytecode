读写字节码
========

Javasist是一个用来处理java字节码的类库。Java字节码存储在被成为class文件的二进制文件中。每个class文件包含一个java类或者接口。

类 `Javassist.CtClass` 是class文件的抽象表示。CtClass(compile-time class/编译时类)对象是处理class文件的把手。下面的程序是一个非常简单的例子：

```java
ClassPool pool = ClassPool.getDefault();
CtClass cc = pool.get("test.Rectangle");
cc.setSuperclass(pool.get("test.Point"));
cc.writeFile();
```

这个程序首先获得一个 ClassPool 对象， 它控制Javassist的字节码修改。ClassPool 对象是 CtClass 对象的容器，CtClass对象代表一个类文件。它在需要时读取class文件来构建 CtClass 对象并记录构建好的对象来响应后续的访问。为了修改类的定义，用户必须首先从 ClassPool 对象中获取代表这个类的 CtClass 对象的引用。ClassPool中的get()方法用于这个目的。如上面程序展示的案例中， 代表类 `test.Rectangle `的CtClass 对象是从 ClassPool 对象中获取并被赋值给变量 cc。getDefault()方法返回的 ClassPool 对象搜索默认系统搜索路径。

从实现的观点， ClassPool 是 CtClass 对象的hash table， 使用类名作为key。ClassPool 中的get()方法搜索这个hash table来查找对应指定key的 CtClass 对象。如果没有找到这样的 CtClass 对象，get()方法读取类文件来构建新的 CtClass 对象，记录在hash table中并随即作为get()方法的结果返回。

从 ClassPool 对象获取的 CtClass 对象可以被修改(如何修改CtClass的细节将在后面描述)。在上面的例子中，类被修改，test.Rectangle 的超类被修改为类 test.Point 。这个修改在CtClass中的writeFile()方法被最终调用时反应到原始类文件中。

writeFile()方法将 CtClass 对象转换为类文件并将它写到本地磁盘。Javassist也提供直接获取修改后的字节码的方法。为了获得这些字节码， 请调用toBytecode()：

```java
byte[] b = cc.toBytecode();
```

你也可以这样直接装载 CtClass ：

```java
Class clazz = cc.toClass();
```

toClass() 要求当前线程的上下文类装载器(context class loader)去装载CtClass表示的类文件。它返回一个代表被装载的类的 java.lang.Class 对象。更多细节，请见下面的章节。

## 定义一个新的类

为了从头开始定义一个新类，必须在 ClassPool 上调用 makeClass() 方法。

```java
ClassPool pool = ClassPool.getDefault();
CtClass cc = pool.makeClass("Point");
```

这个程序定义了一个不包含任何成员的类 Point 。

This program defines a class Point including no members. Member methods of Point can be created with factory methods declared in CtNewMethod and appended to Point with addMethod() in CtClass.

makeClass() cannot create a new interface; makeInterface() in ClassPool can do. Member methods in an interface can be created with abstractMethod() in CtNewMethod. Note that an interface method is an abstract method.

Frozen classes

If a CtClass object is converted into a class file by writeFile(), toClass(), or toBytecode(), Javassist freezes that CtClass object. Further modifications of that CtClass object are not permitted. This is for warning the developers when they attempt to modify a class file that has been already loaded since the JVM does not allow reloading a class.

A frozen CtClass can be defrost so that modifications of the class definition will be permitted. For example,

CtClasss cc = ...;
    :
cc.writeFile();
cc.defrost();
cc.setSuperclass(...);    // OK since the class is not frozen.
After defrost() is called, the CtClass object can be modified again.

If ClassPool.doPruning is set to true, then Javassist prunes the data structure contained in a CtClass object when Javassist freezes that object. To reduce memory consumption, pruning discards unnecessary attributes (attribute_info structures) in that object. For example, Code_attribute structures (method bodies) are discarded. Thus, after a CtClass object is pruned, the bytecode of a method is not accessible except method names, signatures, and annotations. The pruned CtClass object cannot be defrost again. The default value of ClassPool.doPruning is false.

To disallow pruning a particular CtClass, stopPruning() must be called on that object in advance:

CtClasss cc = ...;
cc.stopPruning(true);
    :
cc.writeFile();                             // convert to a class file.
// cc is not pruned.
The CtClass object cc is not pruned. Thus it can be defrost after writeFile() is called.

Note: While debugging, you might want to temporarily stop pruning and freezing and write a modified class file to a disk drive. debugWriteFile() is a convenient method for that purpose. It stops pruning, writes a class file, defrosts it, and turns pruning on again (if it was initially on).
Class search path

The default ClassPool returned by a static method ClassPool.getDefault() searches the same path that the underlying JVM (Java virtual machine) has. If a program is running on a web application server such as JBoss and Tomcat, the ClassPool object may not be able to find user classes since such a web application server uses multiple class loaders as well as the system class loader. In that case, an additional class path must be registered to the ClassPool. Suppose that pool refers to a ClassPool object:

pool.insertClassPath(new ClassClassPath(this.getClass()));
This statement registers the class path that was used for loading the class of the object that this refers to. You can use any Class object as an argument instead of this.getClass(). The class path used for loading the class represented by that Class object is registered.

You can register a directory name as the class search path. For example, the following code adds a directory /usr/local/javalib to the search path:

ClassPool pool = ClassPool.getDefault();
pool.insertClassPath("/usr/local/javalib");
The search path that the users can add is not only a directory but also a URL:

ClassPool pool = ClassPool.getDefault();
ClassPath cp = new URLClassPath("www.javassist.org", 80, "/java/", "org.javassist.");
pool.insertClassPath(cp);
This program adds "http://www.javassist.org:80/java/" to the class search path. This URL is used only for searching classes belonging to a package org.javassist. For example, to load a class org.javassist.test.Main, its class file will be obtained from:

http://www.javassist.org:80/java/org/javassist/test/Main.class
Furthermore, you can directly give a byte array to a ClassPool object and construct a CtClass object from that array. To do this, use ByteArrayClassPath. For example,

ClassPool cp = ClassPool.getDefault();
byte[] b = a byte array;
String name = class name;
cp.insertClassPath(new ByteArrayClassPath(name, b));
CtClass cc = cp.get(name);
The obtained CtClass object represents a class defined by the class file specified by b. The ClassPool reads a class file from the given ByteArrayClassPath if get() is called and the class name given to get() is equal to one specified by name.

If you do not know the fully-qualified name of the class, then you can use makeClass() in ClassPool:

ClassPool cp = ClassPool.getDefault();
InputStream ins = an input stream for reading a class file;
CtClass cc = cp.makeClass(ins);
makeClass() returns the CtClass object constructed from the given input stream. You can use makeClass() for eagerly feeding class files to the ClassPool object. This might improve performance if the search path includes a large jar file. Since a ClassPool object reads a class file on demand, it might repeatedly search the whole jar file for every class file. makeClass() can be used for optimizing this search. The CtClass constructed by makeClass() is kept in the ClassPool object and the class file is never read again.

The users can extend the class search path. They can define a new class implementing ClassPath interface and give an instance of that class to insertClassPath() in ClassPool. This allows a non-standard resource to be included in the search path.



