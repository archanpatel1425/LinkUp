# Generated by Django 4.1.13 on 2024-09-14 13:55

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0002_alter_userprofile_image'),
    ]

    operations = [
        migrations.DeleteModel(
            name='UserProfile',
        ),
    ]
